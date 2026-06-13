"use client";

import {
  buildToolPayload,
  getDefaultModel,
  getDefaultParamsForModel,
  getToolByRoute,
  getToolConfig,
} from "@/lib/tools/tool-registry";
import {
  applyDashboardThemeToRoot,
  getDashboardTheme,
} from "@/lib/tools/dashboard-theme";
import type {
  DashboardThemeKey,
  ToolId,
  ToolModel,
  ToolParams,
} from "@/lib/tools/types";
import { createClient } from "@/lib/supabase/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type DashboardToolContextValue = {
  activeTool: ToolId | null;
  toolConfig: ReturnType<typeof getToolConfig> | null;
  activeModelId: string | null;
  activeModel: ToolModel | null;
  activeParams: ToolParams;
  uploadedFiles: Record<string, string>;
  prompt: string;
  theme: DashboardThemeKey;
  themeColors: ReturnType<typeof getDashboardTheme>;
  credits: number | null;
  userName: string;
  realtimePayload: Record<string, unknown>;
  setPrompt: (value: string) => void;
  setActiveModelId: (modelId: string | null) => void;
  setParam: (key: string, value: unknown) => void;
  setParams: (params: ToolParams) => void;
  setUpload: (field: string, url: string) => void;
  removeUpload: (field: string) => void;
  notifyGenerate: (creditCost?: number) => void;
  notifyParamBurst: () => void;
  showBadge: (text: string, duration?: number, priority?: number) => void;
  registerBadgeHandler: (
    handler: (text: string, duration?: number, priority?: number) => void
  ) => void;
};

const DashboardToolContext = createContext<DashboardToolContextValue | null>(null);

export function DashboardToolProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeTool = useMemo(() => getToolByRoute(pathname), [pathname]);
  const toolConfig = activeTool ? getToolConfig(activeTool) : null;

  const [activeModelId, setActiveModelIdState] = useState<string | null>(null);
  const [activeParams, setActiveParams] = useState<ToolParams>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [userName, setUserName] = useState("Georg");
  const badgeHandler = useRef<
    ((text: string, duration?: number, priority?: number) => void) | null
  >(null);
  const prevTool = useRef<ToolId | null>(null);
  const prevModelId = useRef<string | null>(null);
  const paramChangeCount = useRef(0);
  const paramBurstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creditWarned = useRef(false);

  const activeModel = useMemo(() => {
    if (!toolConfig || !activeModelId) return toolConfig?.models[0] ?? null;
    return toolConfig.models.find((m) => m.id === activeModelId) ?? toolConfig.models[0] ?? null;
  }, [toolConfig, activeModelId]);

  const theme: DashboardThemeKey =
    activeModel?.theme ?? toolConfig?.theme ?? "green";
  const themeColors = getDashboardTheme(theme);

  useEffect(() => {
    applyDashboardThemeToRoot(themeColors);
  }, [themeColors]);

  useEffect(() => {
    if (!activeTool || !toolConfig) return;
    const defaultModel = getDefaultModel(activeTool);
    setActiveModelIdState(defaultModel?.id ?? null);
    setActiveParams(defaultModel ? getDefaultParamsForModel(defaultModel) : {});
    setUploadedFiles({});
  }, [activeTool, toolConfig]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const metaName = user.user_metadata?.full_name as string | undefined;
      const first =
        metaName?.trim().split(/\s+/)[0] ||
        user.email?.split("@")[0] ||
        "Georg";
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

  const showBadge = useCallback(
    (text: string, duration = 4000, priority = 5) => {
      badgeHandler.current?.(text, duration, priority);
    },
    []
  );

  useEffect(() => {
    if (!activeTool || !toolConfig) return;
    if (prevTool.current && prevTool.current !== activeTool) {
      showBadge(`Wechsel zu ${toolConfig.label}... Capabilities werden geladen!`, 4000, 8);
    }
    prevTool.current = activeTool;
  }, [activeTool, toolConfig, showBadge]);

  useEffect(() => {
    if (!activeModel) return;
    if (prevModelId.current && prevModelId.current !== activeModel.id) {
      showBadge(`${activeModel.name} aktiviert. Prozessoren kalibriert.`, 3500, 7);
    }
    prevModelId.current = activeModel.id;
  }, [activeModel, showBadge]);

  useEffect(() => {
    if (credits !== null && credits < 20 && !creditWarned.current) {
      creditWarned.current = true;
      showBadge(`Achtung ${userName}! Nur noch ${credits} Credits!`, 5000, 9);
    }
    if (credits !== null && credits >= 20) {
      creditWarned.current = false;
    }
  }, [credits, userName, showBadge]);

  const setActiveModelId = useCallback(
    (modelId: string | null) => {
      if (!toolConfig) {
        setActiveModelIdState(modelId);
        return;
      }
      const model =
        toolConfig.models.find((m) => m.id === modelId) ?? toolConfig.models[0] ?? null;
      setActiveModelIdState(model?.id ?? null);
      if (model) setActiveParams(getDefaultParamsForModel(model));
    },
    [toolConfig]
  );

  const setParam = useCallback((key: string, value: unknown) => {
    setActiveParams((prev) => ({ ...prev, [key]: value }));
    paramChangeCount.current += 1;
    if (paramBurstTimer.current) clearTimeout(paramBurstTimer.current);
    paramBurstTimer.current = setTimeout(() => {
      if (paramChangeCount.current >= 6) {
        showBadge(
          `Langsam, ${userName}! Diese API-Payload wird gigantisch!`,
          4000,
          6
        );
      }
      paramChangeCount.current = 0;
    }, 800);
  }, [showBadge, userName]);

  const setParams = useCallback((params: ToolParams) => {
    setActiveParams(params);
  }, []);

  const setUpload = useCallback((field: string, url: string) => {
    setUploadedFiles((prev) => ({ ...prev, [field]: url }));
  }, []);

  const removeUpload = useCallback((field: string) => {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const notifyGenerate = useCallback(
    (creditCost?: number) => {
      const cost = creditCost ?? activeModel?.credits ?? toolConfig?.credits.base ?? 0;
      showBadge(`Berechne Output... Kosten: ${cost} Credits`, 4000, 8);
    },
    [activeModel, toolConfig, showBadge]
  );

  const notifyParamBurst = useCallback(() => {
    showBadge(`Langsam, ${userName}! Diese API-Payload wird gigantisch!`, 4000, 6);
  }, [showBadge, userName]);

  const registerBadgeHandler = useCallback(
    (handler: (text: string, duration?: number, priority?: number) => void) => {
      badgeHandler.current = handler;
    },
    []
  );

  const realtimePayload = useMemo(() => {
    if (!activeTool) return { tool: null, prompt: prompt || null };
    return buildToolPayload(
      activeTool,
      prompt,
      activeModel,
      activeParams,
      uploadedFiles
    );
  }, [activeTool, prompt, activeModel, activeParams, uploadedFiles]);

  const value = useMemo<DashboardToolContextValue>(
    () => ({
      activeTool,
      toolConfig,
      activeModelId: activeModel?.id ?? null,
      activeModel,
      activeParams,
      uploadedFiles,
      prompt,
      theme,
      themeColors,
      credits,
      userName,
      realtimePayload,
      setPrompt,
      setActiveModelId,
      setParam,
      setParams,
      setUpload,
      removeUpload,
      notifyGenerate,
      notifyParamBurst,
      showBadge,
      registerBadgeHandler,
    }),
    [
      activeTool,
      toolConfig,
      activeModel,
      activeParams,
      uploadedFiles,
      prompt,
      theme,
      themeColors,
      credits,
      userName,
      realtimePayload,
      setActiveModelId,
      setParam,
      setParams,
      setUpload,
      removeUpload,
      notifyGenerate,
      notifyParamBurst,
      showBadge,
      registerBadgeHandler,
    ]
  );

  return (
    <DashboardToolContext.Provider value={value}>{children}</DashboardToolContext.Provider>
  );
}

export function useDashboardTool() {
  const ctx = useContext(DashboardToolContext);
  if (!ctx) {
    throw new Error("useDashboardTool must be used within DashboardToolProvider");
  }
  return ctx;
}

export function useDashboardToolOptional() {
  return useContext(DashboardToolContext);
}
