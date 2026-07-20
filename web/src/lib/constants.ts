// ==================== API Types ====================

export interface AgnesConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// ---- Chat / Prompt ----

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ---- Image ----

export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  size: string;
  ratio?: string;
  n?: number;
  negative_prompt?: string;
  image?: string[]; // Data URI or URL for img2img
  strength?: number;
  return_base64?: boolean;
}

export interface ImageGenerationResponse {
  created: number;
  data: ImageResult[];
  error?: unknown;
}

export interface ImageResult {
  url?: string | null;
  b64_json?: string | null;
  revised_prompt?: string | null;
}

// ---- Video ----

export interface VideoGenerationRequest {
  model: string;
  prompt: string;
  image?: string;
  mode?: string;
  width?: number;
  height?: number;
  num_frames?: number;
  frame_rate: number;
  num_inference_steps?: number;
  seed?: number;
  negative_prompt?: string;
  extra_body?: {
    image?: string[];
    mode?: string;
  };
}

export interface VideoTaskResponse {
  id: string;
  task_id?: string;
  video_id?: string;
  object: string;
  model: string;
  status: string;
  progress: number;
  created_at: number;
  seconds?: string;
  size?: string;
}

export interface VideoStatusResponse {
  id: string;
  video_id: string;
  model: string;
  object: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  progress: number;
  seconds?: string;
  size?: string;
  url?: string;
  error?: { message: string } | null;
}

// ==================== UI Types ====================

export type ImageSizePreset = "1K" | "2K" | "3K" | "4K";

export interface SizeOption {
  label: string;
  value: string;
  dimensions: Record<string, string>;
}

export const IMAGE_SIZE_OPTIONS: SizeOption[] = [
  { label: "1K", value: "1K", dimensions: { "1:1": "1024x1024", "3:4": "864x1152", "4:3": "1152x864", "16:9": "1312x736", "9:16": "736x1312", "2:3": "832x1248", "3:2": "1248x832", "21:9": "1568x672" } },
  { label: "2K", value: "2K", dimensions: { "1:1": "2048x2048", "3:4": "1728x2304", "4:3": "2304x1728", "16:9": "2624x1472", "9:16": "1472x2624", "2:3": "1664x2496", "3:2": "2496x1664", "21:9": "3136x1344" } },
  { label: "3K", value: "3K", dimensions: { "1:1": "3072x3072", "3:4": "2592x3456", "4:3": "3456x2592", "16:9": "3936x2208", "9:16": "2208x3936", "2:3": "2496x3744", "3:2": "3744x2496", "21:9": "4704x2016" } },
  { label: "4K", value: "4K", dimensions: { "1:1": "4096x4096", "3:4": "3456x4608", "4:3": "4608x3456", "16:9": "5248x2944", "9:16": "2944x5248", "2:3": "3328x4992", "3:2": "4992x3328", "21:9": "6272x2688" } },
];

export const IMAGE_RATIO_OPTIONS = ["1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9"] as const;
export type ImageRatio = (typeof IMAGE_RATIO_OPTIONS)[number];

export const VIDEO_RATIO_OPTIONS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;
export type VideoRatio = (typeof VIDEO_RATIO_OPTIONS)[number];

export const VIDEO_RESOLUTION_PRESETS = {
  "480p": { "16:9": { w: 854, h: 480 }, "9:16": { w: 480, h: 854 }, "1:1": { w: 480, h: 480 }, "4:3": { w: 640, h: 480 }, "3:4": { w: 480, h: 640 } },
  "720p": { "16:9": { w: 1280, h: 720 }, "9:16": { w: 720, h: 1280 }, "1:1": { w: 720, h: 720 }, "4:3": { w: 960, h: 720 }, "3:4": { w: 720, h: 960 } },
  "1080p": { "16:9": { w: 1920, h: 1080 }, "9:16": { w: 1080, h: 1920 }, "1:1": { w: 1080, h: 1080 }, "4:3": { w: 1440, h: 1080 }, "3:4": { w: 1080, h: 1440 } },
} as const;

export const VIDEO_DURATION_CHOICES = [3, 5, 8, 10, 15, 18] as const;
export const VIDEO_FRAME_RATE_CHOICES = [12, 24, 30, 60] as const;
export const VIDEO_RESOLUTION_CHOICES = ["480p", "720p", "1080p"] as const;

export const VIDEO_MODE_OPTIONS = ["ti2vid", "keyframes"] as const;

export function calculateFrames(duration: number, fps: number): number {
  const target = duration * fps;
  const n = Math.round((target - 1) / 8);
  return Math.min(Math.max(8 * n + 1, 9), 441);
}

export function getMaxFrames(resolution: string, width?: number, height?: number): number {
  if (width && height) {
    const maxDim = Math.max(width, height);
    if (maxDim >= 1920) return 169;
    if (maxDim >= 1280) return 409;
    return 961;
  }
  return resolution === "1080p" ? 169 : resolution === "720p" ? 409 : 961;
}

export function getVideoDimensions(resolution: string, ratio: VideoRatio) {
  return VIDEO_RESOLUTION_PRESETS[resolution as keyof typeof VIDEO_RESOLUTION_PRESETS]?.[ratio];
}

// ==================== Navigation ====================

export interface NavItem {
  href: string;
  labelKey: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: "home" },
  { href: "/prompt", labelKey: "nav.promptGenerator", icon: "sparkles" },
  { href: "/optimize", labelKey: "nav.promptOptimizer", icon: "wand-sparkles" },
  { href: "/text-to-image", labelKey: "nav.textToImage", icon: "image" },
  { href: "/image-to-image", labelKey: "nav.imageToImage", icon: "images" },
  { href: "/text-to-video", labelKey: "nav.textToVideo", icon: "clapperboard" },
  { href: "/image-to-video", labelKey: "nav.imageToVideo", icon: "film" },
  { href: "/multi-image-video", labelKey: "nav.multiImageVideo", icon: "photos" },
];
