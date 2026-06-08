"use client";

import { useState, type ReactNode } from "react";
import { ImageResultActions } from "@/components/image/ImageResultActions";
import type { AgentResult } from "@/lib/agent/types";

const sectionLabelStyle = {
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: "rgba(180,255,0,0.6)",
  marginBottom: 6,
};

const textStyle = {
  fontSize: 13,
  color: "rgba(255,255,255,0.88)",
  lineHeight: 1.55,
};

const dividerStyle = {
  borderTop: "1px solid rgba(255,255,255,0.06)",
  margin: "12px 0",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        padding: "2px 8px",
        fontSize: 10,
        border: "1px solid rgba(180,255,0,0.3)",
        borderRadius: 3,
        background: "transparent",
        color: copied ? "#B4FF00" : "rgba(255,255,255,0.4)",
        cursor: "pointer",
        transition: "color 0.2s",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
    >
      {copied ? "✓ Kopiert" : "Kopieren"}
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={sectionLabelStyle}>{children}</div>;
}

function TextRow({
  emoji,
  label,
  text,
}: {
  emoji: string;
  label: string;
  text: string;
}) {
  if (!text.trim()) return null;

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span style={{ ...textStyle, fontWeight: 600 }}>
          {emoji} {label}
        </span>
        <CopyButton text={text} />
      </div>
      <p style={{ ...textStyle, margin: 0, whiteSpace: "pre-wrap" }}>{text}</p>
    </div>
  );
}

function HashtagPills({ hashtags }: { hashtags: string[] }) {
  if (!hashtags.length) return null;

  const joined = hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span style={{ ...textStyle, fontWeight: 600 }}>#️⃣ Hashtags</span>
        <CopyButton text={joined} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {hashtags.map((tag) => {
          const label = tag.startsWith("#") ? tag : `#${tag}`;
          return (
            <span
              key={label}
              className="px-2 py-0.5"
              style={{
                borderRadius: 4,
                border: "1px solid rgba(180,255,0,0.25)",
                background: "rgba(180,255,0,0.06)",
                color: "#B4FF00",
                fontSize: 11,
              }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val;
  }
  return "";
}

function pickHashtags(obj: Record<string, unknown>): string[] {
  const raw = obj.hashtags;
  if (!Array.isArray(raw)) return [];
  return raw.map((h) => String(h)).filter(Boolean);
}

function normalizeResultType(type: string): string {
  const map: Record<string, string> = {
    script_generation: "script",
    hook_generation: "hooks",
    product_ad: "ad",
    content_calendar: "calendar",
    image_generation: "image",
    thumbnail_concept: "image",
    multi_tool_content_package: "content_package",
  };
  return map[type] ?? type;
}

function ScriptOutputView({ data }: { data: unknown }) {
  const obj = asRecord(data);
  if (!obj) return null;

  const hook = pickString(obj, "hook");
  const story = pickString(obj, "story", "script", "body", "main");
  const cta = pickString(obj, "cta", "caption");
  const hashtags = pickHashtags(obj);

  return (
    <div>
      <TextRow emoji="🎬" label="Hook" text={hook} />
      <TextRow emoji="📖" label="Story" text={story} />
      <TextRow emoji="🎯" label="CTA" text={cta} />
      <HashtagPills hashtags={hashtags} />
    </div>
  );
}

function AdOutputView({ data }: { data: unknown }) {
  const obj = asRecord(data);
  if (!obj) return null;

  const hook = pickString(obj, "hook");
  const spot = pickString(obj, "body", "spot", "spotText", "script");
  const hashtags = pickHashtags(obj);

  return (
    <div>
      <TextRow emoji="📣" label="Ad Hook" text={hook} />
      <TextRow emoji="🎥" label="Spot-Text" text={spot} />
      <HashtagPills hashtags={hashtags} />
    </div>
  );
}

function HooksOutputView({ outputs }: { outputs: unknown[] }) {
  let hooks: string[] = [];

  if (outputs.every((item) => typeof item === "string")) {
    hooks = outputs as string[];
  } else if (outputs[0] && typeof outputs[0] === "object") {
    const obj = asRecord(outputs[0]);
    if (obj?.variants && Array.isArray(obj.variants)) {
      hooks = obj.variants.map((v) => String(v));
    } else if (obj?.hooks && Array.isArray(obj.hooks)) {
      hooks = obj.hooks.map((v) => String(v));
    }
  }

  if (!hooks.length) return null;

  return (
    <ol className="m-0 list-none space-y-2 p-0">
      {hooks.map((hook, index) => (
        <li
          key={`${index}-${hook.slice(0, 24)}`}
          className="flex items-start justify-between gap-2"
          style={{
            padding: "8px 10px",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.06)",
            background: index === 0 ? "rgba(180,255,0,0.06)" : "transparent",
          }}
        >
          <span
            style={{
              ...textStyle,
              fontWeight: index === 0 ? 700 : 400,
              flex: 1,
            }}
          >
            {index + 1}. {hook}
          </span>
          <CopyButton text={hook} />
        </li>
      ))}
    </ol>
  );
}

function CalendarOutputView({ outputs }: { outputs: unknown[] }) {
  let entries: Array<Record<string, unknown>> = [];
  let bestTime = "";

  if (outputs.every((item) => asRecord(item))) {
    entries = outputs.map((item) => asRecord(item)!);
  } else {
    const first = asRecord(outputs[0]);
    if (first?.entries && Array.isArray(first.entries)) {
      entries = first.entries
        .map((entry) => asRecord(entry))
        .filter((entry): entry is Record<string, unknown> => !!entry);
      bestTime = pickString(first, "bestTime", "postingTime");
    }
  }

  if (!entries.length) return null;

  return (
    <div>
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ fontSize: 12, color: "rgba(255,255,255,0.88)" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Tag", "Idee", "Format"].map((head) => (
                <th
                  key={head}
                  className="px-2 py-2 text-left"
                  style={sectionLabelStyle}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={`${pickString(entry, "day")}-${index}`}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <td className="px-2 py-2 align-top">{pickString(entry, "day")}</td>
                <td className="px-2 py-2 align-top">{pickString(entry, "idea")}</td>
                <td className="px-2 py-2 align-top">{pickString(entry, "format")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(bestTime || pickString(entries[0] ?? {}, "postingTime")) && (
        <p className="mt-2" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
          Beste Posting-Zeit:{" "}
          {bestTime || pickString(entries[0] ?? {}, "postingTime")}
        </p>
      )}
    </div>
  );
}

function ImageOutputView({ data }: { data: unknown }) {
  const obj = asRecord(data);
  if (!obj) return null;

  const imageUrl = pickString(obj, "imageUrl", "url");
  const prompt = pickString(obj, "prompt", "improvedPrompt", "imagePrompt");
  const generationId = pickString(obj, "generationId");

  if (imageUrl) {
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Generiertes Bild"
          className="w-full max-h-72 object-contain"
          style={{
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#060608",
          }}
        />
        {prompt ? (
          <p className="mt-2" style={{ ...textStyle, fontSize: 11, opacity: 0.7 }}>
            {prompt}
          </p>
        ) : null}
        <ImageResultActions
          imageUrl={imageUrl}
          prompt={prompt}
          generationId={generationId}
        />
      </div>
    );
  }

  if (prompt) {
    return (
      <div
        style={{
          padding: 12,
          borderRadius: 4,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className="px-2 py-0.5"
            style={{
              fontSize: 10,
              borderRadius: 4,
              border: "1px solid rgba(180,255,0,0.3)",
              color: "#B4FF00",
            }}
          >
            Bild wird generiert…
          </span>
          <CopyButton text={prompt} />
        </div>
        <p style={{ ...textStyle, margin: 0 }}>{prompt}</p>
      </div>
    );
  }

  return null;
}

function RawOutputView({ outputs }: { outputs: unknown[] }) {
  const text = JSON.stringify(outputs, null, 2);

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <CopyButton text={text} />
      </div>
      <pre
        className="overflow-x-auto whitespace-pre-wrap"
        style={{
          margin: 0,
          padding: 12,
          borderRadius: 4,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 11,
          color: "rgba(255,255,255,0.75)",
          lineHeight: 1.5,
        }}
      >
        {text}
      </pre>
    </div>
  );
}

function ContentPackageView({ outputs }: { outputs: unknown[] }) {
  const [tab, setTab] = useState<"hooks" | "script" | "calendar">("hooks");
  const tabs = [
    { id: "hooks" as const, label: "Hooks", data: outputs[0] },
    { id: "script" as const, label: "Script", data: outputs[1] },
    { id: "calendar" as const, label: "Kalender", data: outputs[2] },
  ];

  return (
    <div>
      <div className="mb-3 flex gap-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{
              borderRadius: 4,
              border:
                tab === item.id
                  ? "1px solid rgba(180,255,0,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
              background:
                tab === item.id ? "rgba(180,255,0,0.1)" : "transparent",
              color: tab === item.id ? "#B4FF00" : "rgba(255,255,255,0.45)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "hooks" && (
        <HooksOutputView
          outputs={
            Array.isArray(outputs[0])
              ? (outputs[0] as unknown[])
              : outputs[0]
                ? [outputs[0]]
                : []
          }
        />
      )}
      {tab === "script" && <ScriptOutputView data={outputs[1]} />}
      {tab === "calendar" && (
        <CalendarOutputView outputs={outputs[2] ? [outputs[2]] : []} />
      )}
    </div>
  );
}

function VideoBriefingView({ outputs }: { outputs: unknown[] }) {
  return (
    <div>
      <SectionLabel>Script</SectionLabel>
      <ScriptOutputView data={outputs[0]} />
      <div style={dividerStyle} />
      <SectionLabel>Ad / Spot</SectionLabel>
      <AdOutputView data={outputs[1]} />
    </div>
  );
}

export function AgentResultOutputs({ result }: { result: AgentResult }) {
  const { outputs } = result;
  if (!outputs?.length) return null;

  const type = normalizeResultType(result.type);

  return (
    <div
      className="mb-4"
      style={{
        padding: 12,
        borderRadius: 4,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <SectionLabel>Output</SectionLabel>

      {type === "script" && <ScriptOutputView data={outputs[0]} />}
      {type === "hooks" && <HooksOutputView outputs={outputs} />}
      {type === "ad" && <AdOutputView data={outputs[0]} />}
      {type === "calendar" && <CalendarOutputView outputs={outputs} />}
      {type === "image" && <ImageOutputView data={outputs[0]} />}
      {type === "video_briefing" && <VideoBriefingView outputs={outputs} />}
      {type === "content_package" && <ContentPackageView outputs={outputs} />}
      {!["script", "hooks", "ad", "calendar", "image", "video_briefing", "content_package"].includes(
        type
      ) && <RawOutputView outputs={outputs} />}
    </div>
  );
}
