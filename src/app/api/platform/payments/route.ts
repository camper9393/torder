import { requirePlatformOwner } from "@/lib/auth";
import {
  PlatformPaymentMethod,
  PlatformPaymentStatus,
} from "@/model/platformPayment";
import {
  createPlatformPayment,
  listPlatformPayments,
} from "@/service/platformPaymentService";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const data = await listPlatformPayments({
      status:
        status && Object.values(PlatformPaymentStatus).includes(status as PlatformPaymentStatus)
          ? (status as PlatformPaymentStatus)
          : undefined,
      restaurantId: searchParams.get("restaurantId") ?? undefined,
    });
    return sendRJResponse({ success: true, message: "Амжилттай", data });
  } catch (error) {
    console.error("GET /api/platform/payments error:", error);
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requirePlatformOwner(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const data = await createPlatformPayment(authResult, {
      restaurantId: body.restaurantId ?? "",
      amount: body.amount ? Number(body.amount) : undefined,
      currency: body.currency,
      plan: body.plan,
      status: body.status,
      paymentMethod: body.paymentMethod,
      dueDate: body.dueDate,
      note: body.note,
      extendMonths: body.extendMonths ? Number(body.extendMonths) : undefined,
    });
    return sendRJResponse({
      success: true,
      message: "Төлбөр бүртгэгдлээ",
      status: 201,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Серверийн алдаа гарлаа";
    return sendRJResponse({ success: false, message, status: 400 });
  }
}
