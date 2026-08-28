import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";
import { runSeed } from "@/lib/seedData";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function renderHtml(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; background: #f6f6f6; color: #111; }
    pre { background: #fff; border-radius: 12px; padding: 16px; overflow-x: auto; font-size: 14px; line-height: 1.5; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #555; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "SEED_SECRET is not configured on the server" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key || key !== secret) {
    return unauthorized();
  }

  try {
    const supabase = createServiceClient();
    const result = await runSeed(supabase);

    const logText = result.logs.map((l) => l.message).join("\n");
    const summary = [
      result.skippedTradespeople
        ? "Tradespeople: already seeded (skipped)"
        : `Tradespeople seeded: ${result.tradespeopleSeeded}`,
      result.skippedJobs
        ? "Jobs: already seeded (skipped)"
        : `Jobs seeded: ${result.jobsSeeded}`,
    ].join("\n");

    const accept = req.headers.get("accept") ?? "";
    if (accept.includes("application/json")) {
      return NextResponse.json({ ...result, summary });
    }

    return renderHtml(
      result.ok ? "Seed complete" : "Seed failed",
      `<p>${summary.replace(/\n/g, "<br/>")}</p><pre>${logText}</pre>`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const accept = req.headers.get("accept") ?? "";
    if (accept.includes("application/json")) {
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
    return renderHtml("Seed failed", `<p>${message}</p>`, 500);
  }
}
