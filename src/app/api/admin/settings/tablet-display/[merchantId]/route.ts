import { requireReceiptSettingsReadAccess } from "@/lib/settingsAuth"
import {
  resolveTabletDisplayContext,
  type TabletDisplayResolveDebug,
} from "@/lib/resolveTabletDisplayContext"
import {
  getOrCreateTabletDisplaySettings,
  updateTabletDisplaySettings,
} from "@/service/settings/tabletDisplaySettingsService"
import { sendRJResponse } from "@/utils/api"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = { params: Promise<{ merchantId: string }> }

function logTabletDisplayDebug(
  method: string,
  debug: TabletDisplayResolveDebug,
  body?: Record<string, unknown> | null
) {
  console.log(`[tablet-display ${method}]`, {
    params: debug.params,
    bodyKeys: debug.bodyKeys,
    body,
    userId: debug.userId,
    userEmail: debug.userEmail,
    userRole: debug.userRole,
    userRestaurantId: debug.userRestaurantId,
    resolvedMerchantId: debug.resolvedMerchantId,
    resolvedRestaurantId: debug.resolvedRestaurantId,
    sources: debug.sources,
    identity: debug.identity,
  })
}

function tabletDisplayErrorResponse(
  status: number,
  debug: TabletDisplayResolveDebug,
  message = "Restaurant ID олдсонгүй"
) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
      debug: {
        params: debug.params,
        bodyKeys: debug.bodyKeys,
        userId: debug.userId,
        userEmail: debug.userEmail,
        userRole: debug.userRole,
        resolvedMerchantId: debug.resolvedMerchantId,
        resolvedRestaurantId: debug.resolvedRestaurantId,
        identity: debug.identity,
      },
    },
    { status }
  )
}

async function parseJsonBody(
  req: NextRequest
): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireReceiptSettingsReadAccess(req)
  if (auth instanceof Response) return auth

  const params = await context.params
  const resolved = await resolveTabletDisplayContext(req, auth, params, null)
  logTabletDisplayDebug("GET", resolved.debug, null)

  if (!resolved.ok) {
    if (resolved.forbidden) {
      return tabletDisplayErrorResponse(
        403,
        resolved.debug,
        "Энэ рестораны тохиргоонд хандах эрхгүй"
      )
    }
    return tabletDisplayErrorResponse(400, resolved.debug)
  }

  try {
    const data = await getOrCreateTabletDisplaySettings(resolved.restaurantId)
    return sendRJResponse({ success: true, message: "Амжилттай", data })
  } catch (error) {
    console.error("GET tablet display settings error:", error)
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    })
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireReceiptSettingsReadAccess(req)
  if (auth instanceof Response) return auth

  const params = await context.params
  const body = await parseJsonBody(req)
  const resolved = await resolveTabletDisplayContext(req, auth, params, body)
  logTabletDisplayDebug("PATCH", resolved.debug, body)

  if (!resolved.ok) {
    if (resolved.forbidden) {
      return tabletDisplayErrorResponse(
        403,
        resolved.debug,
        "Энэ рестораны тохиргоонд хандах эрхгүй"
      )
    }
    return tabletDisplayErrorResponse(400, resolved.debug)
  }

  try {
    const data = await updateTabletDisplaySettings(resolved.restaurantId, {
      uiScale: body?.uiScale,
      textScale: body?.textScale,
      theme: body?.theme,
    })
    return sendRJResponse({
      success: true,
      message: "Таблет харагдац хадгалагдлаа",
      data,
    })
  } catch (error) {
    console.error("PATCH tablet display settings error:", error)
    return sendRJResponse({
      success: false,
      message: "Серверийн алдаа гарлаа",
      status: 500,
    })
  }
}
