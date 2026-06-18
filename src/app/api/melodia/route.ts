import { MELODIA_SYSTEM_PROMPT } from "@/lib/melodia/system-prompt";

import { buildMelodiaSystemPrompt } from "@/lib/melodia/page-context";
import {
  streamMelodiaChat,
  type MelodiaChatMessage,
} from "@/lib/melodia/stream-chat";
import { assertActivePlan } from "@/lib/access.server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

const MELODIA_CREDIT_COST = 1;

type RequestBody = {
  message?: string;
  history?: MelodiaChatMessage[];
  currentPath?: string;
  userName?: string;
};

function sseLine(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const planDenied = await assertActivePlan();
  if (planDenied) return planDenied;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return Response.json({ error: "Nachricht fehlt." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    MELODIA_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return Response.json(
      { error: "Nicht genug Credits.", credits: creditCheck.credits },
      { status: 402 }
    );
  }

  const history = (body.history ?? []).filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
  );

  const messages: MelodiaChatMessage[] = [
    ...history,
    { role: "user", content: message },
  ];

  const system = buildMelodiaSystemPrompt(
    MELODIA_SYSTEM_PROMPT,
    body.currentPath ?? "/dashboard",
    body.userName
  );

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullText = "";
      let failed = false;

      try {
        for await (const event of streamMelodiaChat(system, messages, {
          enableCaching: true,
        })) {
          if (event.type === "text_delta") {
            fullText += event.text;
            controller.enqueue(
              encoder.encode(sseLine({ type: "text_delta", text: event.text }))
            );
          } else if (event.type === "error") {
            failed = true;
            controller.enqueue(
              encoder.encode(sseLine({ type: "error", message: event.message }))
            );
            break;
          } else if (event.type === "done") {
            break;
          }
        }

        if (!failed && fullText.trim()) {
          const deduction = await deductCredits(
            supabase,
            user.id,
            MELODIA_CREDIT_COST,
            "melodia_chat",
            {
              generationType: "melodia",
              prompt: message.slice(0, 200),
              skipGenerationLog: true,
            }
          );

          if (!deduction.success) {
            controller.enqueue(
              encoder.encode(
                sseLine({
                  type: "error",
                  message: deduction.error ?? "Credits konnten nicht abgezogen werden.",
                })
              )
            );
          } else {
            controller.enqueue(
              encoder.encode(
                sseLine({
                  type: "credits",
                  creditsLeft: deduction.remainingCredits,
                })
              )
            );
          }
        }

        controller.enqueue(encoder.encode(sseLine({ type: "done" })));
      } catch (e) {
        console.error("[melodia] stream:", e);
        controller.enqueue(
          encoder.encode(
            sseLine({ type: "error", message: "Unerwarteter Fehler." })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
