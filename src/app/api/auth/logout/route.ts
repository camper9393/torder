import { USER_TOKEN_COOKIE } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  response.cookies.set(USER_TOKEN_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}