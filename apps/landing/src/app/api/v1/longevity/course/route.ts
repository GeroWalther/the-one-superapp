import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { COURSE, courseProgress } from "@/lib/longevity/service";

/** TheONE LONGEVITY COURSE: the lesson keys in order, and which are done. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    lessons: COURSE.map((l) => l.key),
    completed: await courseProgress(auth.account.id),
  });
}
