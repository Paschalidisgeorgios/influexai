"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AI_MODELS,
  WORKSPACE_TOOLS,
  THEME_COLORS,
  type AIModel,
} from "./registry";

interface WorkspaceState {
  activeToolId: string;
  activeModelId: string;
  prompt: string;
  params: Record<string, string>;
  uploadedFiles: Record<string, string>;
  isGenerating: boolean;
  result: { videoUrl?: string; imageUrl?: string } | null;
  credits: number;
  userName: string;
  dialogStep: number;
}

export function useWorkspace() {
  const router = useRouter();
  const [state, setState] = useState<WorkspaceState>({
    activeToolId: "szenen-generator",
    activeModelId: "seedance-2.0-fast",
    prompt: "",
    params: {},
    uploadedFiles: {},
    isGenerating: false,
    result: null,
    credits: 900,
    userName: "",
    dialogStep: 0,
  });

  const activeModel = useMemo(
    () => AI_MODELS.find((m) => m.id === state.activeModelId) ?? AI_MODELS[0],
    [state.activeModelId]
  );

  const activeTool = useMemo(
    () => WORKSPACE_TOOLS.find((t) => t.id === state.activeToolId) ?? WORKSPACE_TOOLS[0],
    [state.activeToolId]
  );

  const theme = useMemo(() => THEME_COLORS[activeModel.themeKey], [activeModel]);

  const realtimePayload = useMemo(
    () => ({
      model: activeModel.id,
      prompt: state.prompt,
      image_url: state.uploadedFiles["start"] ?? null,
      last_frame_url: state.uploadedFiles["end"] ?? null,
      audio_url: state.uploadedFiles["audio"] ?? null,
      duration: state.params["duration"] ?? activeModel.durations[0],
      resolution: state.params["resolution"] ?? activeModel.resolutions[0],
      parameters: Object.fromEntries(
        Object.entries(state.params).filter(([k]) => !["duration", "resolution"].includes(k))
      ),
    }),
    [state, activeModel]
  );

  const selectTool = useCallback(
    (toolId: string) => {
      const tool = WORKSPACE_TOOLS.find((t) => t.id === toolId);
      if (!tool || tool.comingSoon) return;
      setState((prev) => ({
        ...prev,
        activeToolId: toolId,
        activeModelId: tool.defaultModelId ?? prev.activeModelId,
        prompt: "",
        params: {},
        result: null,
      }));
      router.push(tool.route);
    },
    [router]
  );

  const selectModel = useCallback((modelId: string) => {
    const model = AI_MODELS.find((m) => m.id === modelId);
    if (!model) return;
    setState((prev) => ({
      ...prev,
      activeModelId: modelId,
      params: {},
      result: null,
    }));
  }, []);

  const setParam = useCallback((key: string, value: string) => {
    setState((prev) => ({ ...prev, params: { ...prev.params, [key]: value } }));
  }, []);

  const setPrompt = useCallback((prompt: string) => {
    setState((prev) => ({ ...prev, prompt }));
  }, []);

  const setUploadedFile = useCallback((fieldId: string, url: string) => {
    setState((prev) => ({
      ...prev,
      uploadedFiles: { ...prev.uploadedFiles, [fieldId]: url },
    }));
  }, []);

  const removeUploadedFile = useCallback((fieldId: string) => {
    setState((prev) => {
      const next = { ...prev.uploadedFiles };
      delete next[fieldId];
      return { ...prev, uploadedFiles: next };
    });
  }, []);

  const setUserName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, userName: name, dialogStep: 1 }));
  }, []);

  const advanceDialog = useCallback(() => {
    setState((prev) => ({ ...prev, dialogStep: prev.dialogStep + 1 }));
  }, []);

  const setCredits = useCallback((n: number) => {
    setState((prev) => ({ ...prev, credits: n }));
  }, []);

  const setActiveToolId = useCallback((toolId: string) => {
    setState((prev) => ({ ...prev, activeToolId: toolId }));
  }, []);

  const setActiveModelId = useCallback((modelId: string) => {
    setState((prev) => ({ ...prev, activeModelId: modelId }));
  }, []);

  const setIsGenerating = useCallback((isGenerating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating }));
  }, []);

  const setResult = useCallback((result: WorkspaceState["result"]) => {
    setState((prev) => ({ ...prev, result }));
  }, []);

  return {
    ...state,
    activeModel,
    activeTool,
    theme,
    realtimePayload,
    selectTool,
    selectModel,
    setParam,
    setPrompt,
    setUploadedFile,
    removeUploadedFile,
    setUserName,
    advanceDialog,
    setCredits,
    setActiveToolId,
    setActiveModelId,
    setIsGenerating,
    setResult,
  };
}

export type WorkspaceApi = ReturnType<typeof useWorkspace>;
