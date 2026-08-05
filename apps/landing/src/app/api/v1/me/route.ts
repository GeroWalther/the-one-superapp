import { NextResponse } from "next/server";
import * as z from "zod";
import { accountPayload, apiError, authenticateRequest } from "@/lib/api/auth";
import { MemberProfileSchema } from "@/lib/domain";
import { getMemberProfile, updateMemberProfile } from "@/lib/profile/service";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const account = accountPayload(auth.account);

  /* Partners edit their public listing at /partners/me instead — their profile
     is the thing members browse, not a private record. */
  if (auth.account.role !== "member") {
    return NextResponse.json({ account, profile: null });
  }

  return NextResponse.json({
    account,
    profile: await getMemberProfile(auth.account.id),
  });
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  if (auth.account.role !== "member") {
    return apiError("forbidden", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }

  const parsed = MemberProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", code: "validation_failed", fields: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    );
  }

  const saved = await updateMemberProfile(auth.account.id, parsed.data);
  if (!saved) return apiError("not_found", 404);

  return NextResponse.json({ profile: await getMemberProfile(auth.account.id) });
}
