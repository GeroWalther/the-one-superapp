import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import {
  isLongevityConfigured,
  listLongevityChecks,
  runLongevityCheck,
} from "@/lib/longevity/service";

/** The member's TheONE LONGEVITY CHECK results, newest first. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ checks: await listLongevityChecks(auth.account.id) });
}

/** One check: `{ answers, note, language }`. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (!isLongevityConfigured()) return apiError("assistant_not_configured", 503);

  let body: { answers?: unknown; note?: unknown; language?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }

  const result = await runLongevityCheck({
    account: auth.account,
    answers: body.answers,
    note: body.note,
    language: body.language,
  });
  if (!result.ok) {
    const status =
      result.reason === "too_many" ? 429
      : result.reason === "not_configured" ? 503
      : result.reason === "error" ? 502
      : 422;
    return NextResponse.json({ error: result.reason, code: result.reason }, { status });
  }
  return NextResponse.json({ check: result.check });
}
