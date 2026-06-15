import { USER_TOKEN_COOKIE, MERCHANT_TOKEN_COOKIE } from "@/lib/auth";
import { clearPlatformSupportContext } from "@/lib/platformSupportServer";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(MERCHANT_TOKEN_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  response.cookies.set(USER_TOKEN_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  clearPlatformSupportContext(response);

  return response;
}
