export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface VideoPollResult {
  status: "queued" | "in_progress" | "completed" | "failed";
  progress: number;
  url?: string;
  seconds?: string;
  size?: string;
  error?: string;
}
