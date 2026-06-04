import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  estimateAgentCredits,
  fullPipelineCreditSum,
} from "@/lib/agent/credits";
import { runMasterAgentStream } from "@/lib/agent/run-agent";
import type { AgentChatMessage, AgentStreamEvent } from "@/lib/agent/types";

export const maxDuration = 300;

type RequestBody = {
  message?: string;
  history?: AgentChatMessage[];
  estimateOnly?: boolean;
};

function sseLine(event: AgentStreamEvent | Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get("message") ?? "";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  const estimate = message
    ? estimateAgentCredits(message)
    : {
        min: 2,
        max: fullPipelineCreditSum(),
        typical: fullPipelineCreditSum(),
        label: `~${fullPipelineCreditSum()} Credits`,
      };

  return Response.json({
    credits: profile?.credits ?? 0,
    estimate,
    fullPipeline: fullPipelineCreditSum(),
  });
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const message = body.message?.trim() ?? "";
  if (!message && !body.estimateOnly) {
    return Response.json({ error: "Nachricht fehlt." }, { status: 400 });
  }

  if (body.estimateOnly) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    const estimate = estimateAgentCredits(message);
    return Response.json({
      credits: profile?.credits ?? 0,
      estimate,
      message: `Dieser Agent-Run kostet ${estimate.label}`,
    });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const estimate = estimateAgentCredits(message);
        controller.enqueue(
          encoder.encode(
            sseLine({
              type: "estimate",
              min: estimate.min,
              max: estimate.max,
              typical: estimate.typical,
              label: estimate.label,
            })
          )
        );

        for await (const event of runMasterAgentStream(message, history)) {
          controller.enqueue(encoder.encode(sseLine(event)));
          if (event.type === "credits") {
            // client can refresh credits
          }
        }
      } catch (e) {
        console.error("[agent] stream:", e);
        controller.enqueue(
          encoder.encode(
            sseLine({
              type: "error",
              message: "Agent-Lauf fehlgeschlagen.",
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
