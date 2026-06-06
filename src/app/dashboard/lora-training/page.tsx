"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Bot,
  Brain,
  Brush,
  Copy,
  User,
  Check,
} from "lucide-react";
import { UseLoraModal } from "@/components/lora/UseLoraModal";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { calcLoraCredits } from "@/lib/lora-credits";
import {
  LORA_ESTIMATED_MINUTES,
  LORA_MAX_IMAGES,
  LORA_MIN_IMAGES,
  LORA_RECOMMENDED_IMAGES,
  LORA_STEPS_DEFAULT,
  LORA_STEPS_MAX,
  LORA_STEPS_MIN,
  LORA_STORAGE_BUCKET,
  LORA_TYPE_META,
  TRIGGER_WORD_PRESETS,
  type LoraModelType,
} from "@/lib/lora-config";
import { createClient } from "@/lib/supabase/client";

type Step = "setup" | "training" | "done";

type LoraRow = {
  id: string;
  name: string;
  trigger_word: string;
  type: LoraModelType;
  status: string;
  lora_url: string | null;
  thumbnail_url: string | null;
  training_images_count: number | null;
  steps: number;
  progress: number | null;
  error_message: string | null;
  created_at: string;
};

const TYPE_ICONS: Record<LoraModelType, typeof User> = {
  portrait: User,
  style: Brush,
  product: Box,
  character: Bot,
};

function card() {
  return {
    padding: 24,
    borderRadius: 16,
    background: "#0f0f12",
    border: "1px solid rgba(255,255,255,0.07)",
  } as const;
}

function LoraTrainingPageInner() {
  const t = useTranslations("flows.loraTraining");
  const [step, setStep] = useState<Step>("setup");
  const [trainType, setTrainType] = useState<LoraModelType>("portrait");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [modelName, setModelName] = useState("");
  const [triggerWord, setTriggerWord] = useState("MYFACE");
  const [trainingSteps, setTrainingSteps] = useState(LORA_STEPS_DEFAULT);
  const [isStyle, setIsStyle] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLoraId, setActiveLoraId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [models, setModels] = useState<LoraRow[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [useModalLora, setUseModalLora] = useState<LoraRow | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const creditCost = calcLoraCredits(trainingSteps);

  const loadModels = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("lora_models")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setModels(data as LoraRow[]);
      const urls: Record<string, string> = {};
      for (const m of data) {
        if (m.thumbnail_url) {
          const { data: signed } = await supabase.storage
            .from(LORA_STORAGE_BUCKET)
            .createSignedUrl(m.thumbnail_url, 3600);
          if (signed?.signedUrl) urls[m.id] = signed.signedUrl;
        }
      }
      setThumbUrls(urls);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    setIsStyle(trainType === "style");
    if (trainType === "portrait") setTriggerWord("MYFACE");
    if (trainType === "style") setTriggerWord("MYSTYLE");
    if (trainType === "product") setTriggerWord("MYPRODUCT");
    if (trainType === "character") setTriggerWord("MYCHAR");
  }, [trainType]);

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/")
    );
    const merged = [...files, ...list].slice(0, LORA_MAX_IMAGES);
    setFiles(merged);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return merged.map((f) => URL.createObjectURL(f));
    });
  };

  const pollStatus = useCallback(
    (loraId: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/lora/status/${loraId}`);
          const data = await res.json();
          if (data.progress != null) setProgress(data.progress);
          if (Array.isArray(data.logs)) setLogs(data.logs);
          if (data.status === "ready") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStep("done");
            setLoading(false);
            loadModels();
          }
          if (data.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setError(data.errorMessage ?? t("error_training_failed"));
            setStep("setup");
            setLoading(false);
            loadModels();
          }
        } catch {
          /* keep polling */
        }
      }, 4000);
    },
    [loadModels, t]
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  const startTraining = async () => {
    if (files.length < LORA_MIN_IMAGES) {
      setError(t("error_min_images", { min: LORA_MIN_IMAGES }));
      return;
    }
    if (!modelName.trim() || !triggerWord.trim()) {
      setError(t("error_missing_fields"));
      return;
    }

    setError(null);
    setLoading(true);
    setStep("training");
    setProgress(0);
    setLogs([]);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));

      const uploadRes = await fetch("/api/lora/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? t("error_upload"));

      const trainRes = await fetch("/api/lora/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modelName.trim(),
          triggerWord: triggerWord.trim(),
          type: trainType,
          zipUrl: uploadData.zipUrl,
          sessionId: uploadData.sessionId,
          thumbnailPath: uploadData.thumbnailPath,
          imageCount: uploadData.imageCount,
          steps: trainingSteps,
          isStyle: trainType === "style" ? isStyle : false,
        }),
      });
      const trainData = await trainRes.json();
      if (!trainRes.ok) throw new Error(trainData.error ?? t("error_generic"));

      setActiveLoraId(trainData.loraId);
      pollStatus(trainData.loraId);
      window.dispatchEvent(new Event("credits-updated"));
      loadModels();
    } catch (err) {
      setError(
        sanitizeUserMessage(err instanceof Error ? err.message : t("error_generic"))
      );
      setStep("setup");
      setLoading(false);
    }
  };

  const deleteModel = async (id: string) => {
    if (!confirm(t("delete_confirm"))) return;
    const res = await fetch("/api/lora/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadModels();
  };

  const copyTrigger = (word: string, id: string) => {
    navigator.clipboard.writeText(word);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const resetForm = () => {
    setStep("setup");
    setActiveLoraId(null);
    setProgress(0);
    setLogs([]);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 4px" }}>
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Brain size={28} color="#B4FF00" />
            <h1
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                letterSpacing: "0.02em",
                color: "#F0EFE8",
                margin: 0,
              }}
            >
              {t("title")}
            </h1>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 99,
                background: "rgba(180,255,0,0.15)",
                color: "#B4FF00",
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
              }}
            >
              BETA
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", margin: 0 }}>{t("description")}</p>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            fontSize: "0.88rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Demo */}
      <div style={{ ...card(), marginBottom: 16 }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {t("demo_title")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={{ padding: 16, borderRadius: 12, background: "#18181d", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>{t("demo_without")}</div>
            <div style={{ height: 120, borderRadius: 8, background: "linear-gradient(135deg,#2a2a2a,#1a1a1a)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.65)", fontSize: "0.85rem" }}>
              Generic AI
            </div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "rgba(180,255,0,0.06)", border: "1px solid rgba(180,255,0,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#B4FF00", marginBottom: 8 }}>{t("demo_with")}</div>
            <div style={{ height: 120, borderRadius: 8, background: "linear-gradient(135deg,#1a2a0a,#0f0f12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#B4FF00", fontSize: "0.85rem" }}>
              MYFACE in new scene ✓
            </div>
          </div>
        </div>
      </div>

      {step === "setup" && (
        <>
          {/* Type cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            {(Object.keys(LORA_TYPE_META) as LoraModelType[]).map((type) => {
              const meta = LORA_TYPE_META[type];
              const Icon = TYPE_ICONS[type];
              const selected = trainType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTrainType(type)}
                  style={{
                    ...card(),
                    cursor: "pointer",
                    textAlign: "left",
                    border: `1px solid ${selected ? "rgba(180,255,0,0.45)" : "rgba(255,255,255,0.07)"}`,
                    background: selected ? "rgba(180,255,0,0.06)" : "#0f0f12",
                    minHeight: 44,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Icon size={20} color={selected ? "#B4FF00" : "rgba(255,255,255,0.65)"} />
                    <span style={{ fontWeight: 700, color: "#F0EFE8" }}>{t(`type_${type}`)}</span>
                    {meta.recommended && (
                      <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "#B4FF00", fontWeight: 800 }}>✓ {t("recommended")}</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{t(`type_${type}_desc`)}</p>
                </button>
              );
            })}
          </div>

          {/* Upload */}
          <div style={{ ...card(), marginBottom: 16 }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {t("upload_label")} ({files.length}/{LORA_MAX_IMAGES})
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#B4FF00" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 12,
                padding: previews.length ? 12 : 28,
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(180,255,0,0.05)" : "#18181d",
                minHeight: 100,
              }}
            >
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
              {previews.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {previews.slice(0, 12).map((src, i) => (
                    <img key={i} src={src} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                  ))}
                  {previews.length > 12 && <span style={{ color: "rgba(255,255,255,0.65)", alignSelf: "center" }}>+{previews.length - 12}</span>}
                </div>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.65)", margin: 0 }}>{t("upload_drop")}</p>
              )}
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", marginTop: 10, lineHeight: 1.6 }}>
              {t("upload_rules", { min: LORA_MIN_IMAGES, rec: LORA_RECOMMENDED_IMAGES, max: LORA_MAX_IMAGES })}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#B4FF00", marginTop: 6, opacity: 0.85 }}>{t(LORA_TYPE_META[trainType].tipKey)}</p>
          </div>

          {/* Settings */}
          <div style={{ ...card(), marginBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 8 }}>{t("name_label")}</label>
              <input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder={t("name_placeholder")} style={{ width: "100%", padding: "14px 16px", minHeight: 48, borderRadius: 10, background: "#18181d", border: "1px solid rgba(255,255,255,0.09)", color: "#F0EFE8", fontSize: "16px" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 8 }}>{t("trigger_label")}</label>
              <input value={triggerWord} onChange={(e) => setTriggerWord(e.target.value.toUpperCase())} placeholder="MYFACE" style={{ width: "100%", padding: "14px 16px", minHeight: 48, borderRadius: 10, background: "#18181d", border: "1px solid rgba(255,255,255,0.09)", color: "#B4FF00", fontSize: "16px", fontWeight: 700, letterSpacing: "0.06em" }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {TRIGGER_WORD_PRESETS.map((p) => (
                  <button key={p} type="button" onClick={() => setTriggerWord(p)} style={{ padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(180,255,0,0.25)", background: triggerWord === p ? "rgba(180,255,0,0.12)" : "transparent", color: "#B4FF00", fontSize: "0.72rem", cursor: "pointer", minHeight: 32 }}>{p}</button>
                ))}
              </div>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", marginTop: 8 }}>{t("trigger_hint")}</p>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
                  {t("steps_label")}: {trainingSteps}
                </label>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#B4FF00" }}>
                  {creditCost} Credits
                </span>
              </div>
              <input type="range" min={LORA_STEPS_MIN} max={LORA_STEPS_MAX} step={100} value={trainingSteps} onChange={(e) => setTrainingSteps(Number(e.target.value))} style={{ width: "100%", accentColor: "#B4FF00" }} />
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", marginTop: 6 }}>{t("steps_hint")}</p>
            </div>
            {trainType === "style" && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 44 }}>
                <input type="checkbox" checked={isStyle} onChange={(e) => setIsStyle(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#B4FF00" }} />
                <span style={{ color: "#F0EFE8", fontSize: "0.88rem" }}>{t("style_toggle")}</span>
              </label>
            )}
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#B4FF00",
              fontWeight: 700,
              fontSize: "0.9rem",
              marginBottom: 10,
            }}
          >
            {t("cost_preview", { credits: creditCost })}
          </p>

          <button
            type="button"
            onClick={startTraining}
            disabled={loading || files.length < LORA_MIN_IMAGES}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: files.length >= LORA_MIN_IMAGES ? "#B4FF00" : "#2a2a2a",
              color: files.length >= LORA_MIN_IMAGES ? "#060608" : "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              letterSpacing: "0.04em",
              cursor: files.length >= LORA_MIN_IMAGES ? "pointer" : "default",
              minHeight: 52,
              marginBottom: 8,
            }}
          >
            {t("start_button", { credits: creditCost })}
          </button>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", marginBottom: 24 }}>{t("estimated_time", { time: LORA_ESTIMATED_MINUTES })}</p>
        </>
      )}

      {step === "training" && (
        <div style={{ ...card(), textAlign: "center", padding: "48px 24px", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #B4FF00", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
          <h2 style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#F0EFE8", marginBottom: 8 }}>{t("training_title")}</h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", marginBottom: 20 }}>{t("training_subtitle")}</p>
          <div style={{ height: 8, borderRadius: 99, background: "#18181d", overflow: "hidden", maxWidth: 400, margin: "0 auto 12px" }}>
            <div style={{ height: "100%", width: `${Math.max(progress, 5)}%`, background: "#B4FF00", transition: "width 0.4s" }} />
          </div>
          <p style={{ color: "#B4FF00", fontWeight: 700, marginBottom: 16 }}>{progress}%</p>
          {logs.length > 0 && (
            <div style={{ textAlign: "left", maxWidth: 420, margin: "0 auto", padding: 12, borderRadius: 8, background: "#18181d", fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", fontFamily: "monospace", maxHeight: 120, overflow: "auto" }}>
              {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          )}
          <button type="button" onClick={resetForm} style={{ marginTop: 20, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.09)", background: "transparent", color: "rgba(255,255,255,0.65)", cursor: "pointer" }}>
            {t("training_background")}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {step === "done" && (
        <div style={{ ...card(), textAlign: "center", padding: 32, marginBottom: 24, border: "1px solid rgba(180,255,0,0.3)" }}>
          <Check size={40} color="#B4FF00" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#F0EFE8" }}>{t("done_title")}</h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>{t("done_subtitle")}</p>
          <button type="button" onClick={resetForm} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "#B4FF00", color: "#060608", fontWeight: 700, cursor: "pointer" }}>{t("done_button")}</button>
          <AiOutputDisclaimer className="mt-4" />
        </div>
      )}

      {/* My models */}
      <div style={card()}>
        <h2 style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "1.4rem", color: "#F0EFE8", marginBottom: 16 }}>{t("models_title")}</h2>
        {models.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>{t("models_empty")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {models.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 14, padding: 14, borderRadius: 12, background: "#18181d", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "#0f0f12", flexShrink: 0 }}>
                  {thumbUrls[m.id] ? <img src={thumbUrls[m.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.65)", fontSize: "1.2rem" }}>🧠</div>}
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, color: "#F0EFE8" }}>{m.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <code style={{ color: "#B4FF00", fontSize: "0.78rem" }}>{m.trigger_word}</code>
                    <button type="button" onClick={() => copyTrigger(m.trigger_word, m.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.65)" }}>
                      {copied === m.id ? <Check size={14} color="#B4FF00" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }}>{t(`type_${m.type}`)}</span>
                    <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 99, background: m.status === "ready" ? "rgba(180,255,0,0.12)" : m.status === "failed" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)", color: m.status === "ready" ? "#B4FF00" : m.status === "failed" ? "#fca5a5" : "rgba(255,255,255,0.65)" }}>
                      {t(`status_${m.status}`)}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {m.status === "ready" && (
                    <button type="button" onClick={() => setUseModalLora(m)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#B4FF00", color: "#060608", fontWeight: 700, cursor: "pointer", minHeight: 40 }}>{t("use_button")}</button>
                  )}
                  {m.status === "training" && activeLoraId !== m.id && (
                    <button type="button" onClick={() => { setActiveLoraId(m.id); setStep("training"); pollStatus(m.id); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(180,255,0,0.35)", background: "transparent", color: "#B4FF00", cursor: "pointer", minHeight: 40 }}>{t("view_progress")}</button>
                  )}
                  <button type="button" onClick={() => deleteModel(m.id)} disabled={m.status === "training"} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.09)", background: "transparent", color: m.status === "training" ? "#333" : "rgba(255,255,255,0.65)", cursor: m.status === "training" ? "default" : "pointer", minHeight: 40 }}>{t("delete_button")}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UseLoraModal open={!!useModalLora} onClose={() => setUseModalLora(null)} lora={useModalLora} />
    </div>
  );
}

export default function LoraTrainingPage() {
  const t = useTranslations("flows.loraTraining");
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.65)" }}>{t("loading")}</div>}>
      <LoraTrainingPageInner />
    </Suspense>
  );
}
