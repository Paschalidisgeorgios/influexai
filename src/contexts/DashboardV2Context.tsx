"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  getDefaultModelId,
  getToolByRoute,
  type DashboardToolDef,
} from "@/lib/dashboard-v2/tool-registry";
import {
  getModelById,
  type AIModel,
  type ThemeKey,
} from "@/lib/dashboard-v2/model-registry";
import { useModelTheme } from "@/hooks/dashboard/useModelTheme";
import {
  useRealtimePayload,
  type ToolParams,
} from "@/hooks/dashboard/useRealtimePayload";
import { useSentientBadge } from "@/hooks/dashboard/useSentientBadge";
import { createClient } from "@/lib/supabase/client";

type DashboardV2ContextValue = {
  tool: DashboardToolDef | null;
  model: AIModel | null;
  models: AIModel[];
  themeKey: ThemeKey;
  themeRgb: string;
  prompt: string;
  params: ToolParams;
  uploads: Record<string, string>;
  payload: Record<string, unknown>;
  credits: number | null;
  userName: string;
  capsuleMessage: string;
  capsuleFlashing: boolean;
  setPrompt: (value: string) => void;
  setParam: (key: string, value: string | number | boolean | null) => void;
  setUpload: (key: string, url: string) => void;
  setActiveModelId: (modelId: string) => void;
  showCapsule: (msg: string, duration?: number, priority?: number) => void;
};

const DashboardV2Context = createContext<DashboardV2ContextValue | null>(null);

function buildDefaultParams(model: AIModel | null): ToolParams {
  if (!model) return {};
  const params: ToolParams = {};
  if (model.durations[0]) params.duration = model.durations[0];
  if (model.resolutions[0]) params.resolution = model.resolutions[0];
  for (const [key, values] of Object.entries(model.params)) {
    if (values?.[0]) params[key] = values[0];
  }
  if (model.supportsAudio) params.generateAudio = true;
  return params;
}

export function DashboardV2Provider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tool = useMemo(() => getToolByRoute(pathname), [pathname]);

  const models = useMemo(() => {
    if (!tool?.hasModels) return [];
    return tool.modelIds
      .map((id) => getModelById(id))
      .filter((m): m is AIModel => Boolean(m));
  }, [tool]);

  const [activeModelId, setActiveModelIdState] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [params, setParamsState] = useState<ToolParams>({});
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [credits, setCredits] = useState<number | null>(null);
  const [userName, setUserName] = useState("Creator");

  const { message: capsuleMessage, isFlashing: capsuleFlashing, showMessage: showCapsule } =
    useSentientBadge();

  useEffect(() => {
    if (!tool) return;
    const defaultId = getDefaultModelId(tool);
    setActiveModelIdState(defaultId);
    const nextModel = defaultId ? getModelById(defaultId) : null;
    setParamsState(buildDefaultParams(nextModel ?? null));
    setUploads({});
    setPrompt("");
    showCapsule(`${tool.label} geladen. Capabilities aktiv.`, 3500, 6);
  }, [tool, showCapsule]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const metaName = user.user_metadata?.full_name as string | undefined;
      const first =
        metaName?.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "Creator";
      setUserName(first);
      void supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (typeof data?.credits === "number") setCredits(data.credits);
        });
    });
  }, []);

  useEffect(() => {
    const onCredits = () => {
      void createClient()
        .auth.getUser()
        .then(({ data: { user } }) => {
          if (!user) return;
          return createClient()
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();
        })
        .then((result) => {
          if (typeof result?.data?.credits === "number") setCredits(result.data.credits);
        });
    };
    window.addEventListener("credits-updated", onCredits);
    return () => window.removeEventListener("credits-updated", onCredits);
  }, []);

  const model = useMemo(
    () => (activeModelId ? getModelById(activeModelId) ?? null : null),
    [activeModelId]
  );

  const themeKey: ThemeKey = model?.themeKey ?? tool?.themeKey ?? "green";
  const theme = useModelTheme(themeKey);

  const payload = useRealtimePayload(tool, model, prompt, params, uploads);

  const setParam = useCallback((key: string, value: string | number | boolean | null) => {
    setParamsState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setUpload = useCallback((key: string, url: string) => {
    setUploads((prev) => ({ ...prev, [key]: url }));
  }, []);

  const setActiveModelId = useCallback(
    (modelId: string) => {
      setActiveModelIdState(modelId);
      const next = getModelById(modelId);
      if (next) {
        setParamsState(buildDefaultParams(next));
        showCapsule(`${next.name} aktiviert.`, 3000, 7);
      }
    },
    [showCapsule]
  );

  const value = useMemo<DashboardV2ContextValue>(
    () => ({
      tool,
      model,
      models,
      themeKey,
      themeRgb: theme.rgb,
      prompt,
      params,
      uploads,
      payload,
      credits,
      userName,
      capsuleMessage,
      capsuleFlashing,
      setPrompt,
      setParam,
      setUpload,
      setActiveModelId,
      showCapsule,
    }),
    [
      tool,
      model,
      models,
      themeKey,
      theme.rgb,
      prompt,
      params,
      uploads,
      payload,
      credits,
      userName,
      capsuleMessage,
      capsuleFlashing,
      setParam,
      setUpload,
      setActiveModelId,
      showCapsule,
    ]
  );

  return (
    <DashboardV2Context.Provider value={value}>{children}</DashboardV2Context.Provider>
  );
}

export function useDashboardV2() {
  const ctx = useContext(DashboardV2Context);
  if (!ctx) {
    throw new Error("useDashboardV2 must be used within DashboardV2Provider");
  }
  return ctx;
}

export function useDashboardV2Optional() {
  return useContext(DashboardV2Context);
}
