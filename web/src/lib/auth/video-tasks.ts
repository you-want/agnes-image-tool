import { NextResponse } from "next/server";
import { authDatabase } from "./database";

export async function recordVideoTask(userId: string, result: Record<string, unknown>): Promise<void> {
  const id = result.video_id || result.id || result.task_id;
  // Some upstream responses include a finished video directly, without a task.
  if (typeof id !== "string" || !id) return;
  const { error } = await authDatabase().from("agnes_video_tasks").insert({ task_id: id, user_id: userId });
  if (error) throw new Error("无法保存视频任务，请联系管理员。");
}

export async function requireVideoOwner(userId: string, taskId: string): Promise<NextResponse | null> {
  try {
    const { data, error } = await authDatabase().from("agnes_video_tasks")
      .select("task_id").eq("task_id", taskId).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return data ? null : NextResponse.json({ error: "视频任务不存在或无权访问。" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "暂时无法验证视频任务权限。" }, { status: 503 });
  }
}
