import { requirePlatformOwner } from "@/lib/auth";
import { PlatformPaymentStatus } from "@/model/platformPayment";
import { updatePlatformPayment } from "@/service/platformPaymentService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  const { id } = await context.params;
  try {
    const body = await req.json();
    const status =
      typeof body.status === "string" &&
      Object.values(PlatformPaymentStatus).includes(body.status as PlatformPaymentStatus)
        ? (body.status as PlatformPaymentStatus)
        : undefined;

    const data = await updatePlatformPayment(authResult, id, {
      status,
      note: typeof body.note === "string" ? body.note : undefined,
      extendMonths: body.extendMonths ? Number(body.extendMonths) : undefined,
    });

    if (!data) {
      return sendRJResponse({
        success: false,
        message: "Төлбөр олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Амжилттай хадгаллаа",
      data,
    });
  } catch (error) {
    console.error("PATCH /api/platform/payments/[id] error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}
