import { requirePlatformOwner } from "@/lib/auth";
import { clearPlatformSupportContext } from "@/lib/platformSupportServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const res = NextResponse.json({
    success: true,
    message: "Support горимоос гарлаа",
    data: {
      redirectPath: "/platform/restaurants",
    },
  });

  clearPlatformSupportContext(res);
  return res;
}
