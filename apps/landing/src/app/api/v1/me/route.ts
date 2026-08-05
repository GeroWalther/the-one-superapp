import { NextResponse } from "next/server";
import { accountPayload, authenticateRequest } from "@/lib/api/auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ account: accountPayload(auth.account) });
}
