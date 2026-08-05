import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { getPartner } from "@/lib/api/partners";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const partner = await getPartner({
    accountId: new ObjectId(auth.account.id),
    partnerId: id,
  });

  if (!partner) return apiError("not_found", 404);
  return NextResponse.json({ partner });
}
