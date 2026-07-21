const PROMPT_STORAGE_KEY = "agnes_current_prompt";

export function getGlobalPrompt(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(PROMPT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setGlobalPrompt(value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROMPT_STORAGE_KEY, value);
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function clearGlobalPrompt(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PROMPT_STORAGE_KEY);
  } catch {}
}
