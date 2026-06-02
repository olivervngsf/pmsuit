import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_STATUS = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
    // Keep completedAt consistent so velocity/insights stay accurate.
    data.completedAt = body.status === "DONE" ? new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const task = await prisma.task.update({ where: { id }, data });
    return NextResponse.json({ ok: true, task });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}
