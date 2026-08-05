import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { setSaved } from "@/lib/api/partners";

async function toggle(request: Request, id: string, saved: boolean) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const ok = await setSaved({
    accountId: new ObjectId(auth.account.id),
    partnerId: id,
    saved,
  });

  if (!ok) return apiError("not_found", 404);
  return NextResponse.json({ saved });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggle(request, id, true);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggle(request, id, false);
}
