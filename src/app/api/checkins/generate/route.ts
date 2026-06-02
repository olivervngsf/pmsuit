import { NextResponse } from "next/server";
import { runProjectCheckIn, runInitiativeCheckIn } from "@/lib/checkin-service";
import { isAIConfigured } from "@/lib/ai";

export async function POST(req: Request) {
  let body: { type?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, id } = body;
  if (!id || (type !== "project" && type !== "initiative")) {
    return NextResponse.json(
      { error: "Provide { type: 'project'|'initiative', id }" },
      { status: 400 },
    );
  }

  try {
    const result =
      type === "project"
        ? await runProjectCheckIn(id)
        : await runInitiativeCheckIn(id);
    return NextResponse.json({
      ok: true,
      aiConfigured: isAIConfigured(),
      draft: result.draft,
      checkInId: result.checkIn.id,
    });
  } catch (err) {
    console.error("[checkins/generate]", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
