export type AvatarRenderJobStatus =
  | "draft"
  | "queued"
  | "uploading"
  | "running"
  | "quality_check"
  | "compositing"
  | "completed"
  | "failed"
  | "cancelled";

export type AvatarResolution = "720p" | "1080p";
export type AvatarAspectRatio = "9:16" | "1:1" | "16:9";
export type AvatarDuration = 15 | 30 | 60;

export type AvatarRenderOptions = {
  durationSeconds: AvatarDuration;
  resolution: AvatarResolution;
  aspectRatio: AvatarAspectRatio;
  subtitles: boolean;
  branding: boolean;
  voiceover: boolean;
};

export type AvatarQualityReport = {
  passed: boolean;
  videoExists: boolean;
  durationOk: boolean;
  resolutionOk: boolean;
  faceVisible?: boolean;
  issues: string[];
  retryCount: number;
};

export type AvatarRenderJob = {
  id: string;
  userId: string;
  sourceImageKey: string;
  sourceImageUrl?: string;
  drivingVideoKey: string;
  drivingVideoUrl?: string;
  options: AvatarRenderOptions;
  estimatedCredits: number;
  usedCredits: number;
  status: AvatarRenderJobStatus;
  runpodJobId?: string;
  rawOutputKey?: string;
  rawOutputUrl?: string;
  finalOutputKey?: string;
  finalOutputUrl?: string;
  qualityReport?: AvatarQualityReport;
  error?: string;
  consentGiven: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreditReservation = {
  id: string;
  userId: string;
  jobId: string;
  amount: number;
  status: "reserved" | "charged" | "released";
  createdAt: string;
};
