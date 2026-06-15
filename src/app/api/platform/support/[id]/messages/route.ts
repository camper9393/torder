import { requirePlatformOwner } from "@/lib/auth";
import { addSupportMessage } from "@/service/supportTicketService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const message = await addSupportMessage(authResult, id, {
      body: body.body ?? body.message ?? "",
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
    });
    return sendRJResponse({
      success: true,
      message: "Мессеж илгээгдлээ",
      data: message,
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({ success: false, message: msg, status: 400 });
  }
}
