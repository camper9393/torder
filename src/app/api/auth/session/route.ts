import { NextRequest, NextResponse } from "next/server"
import { Merchants } from "@/model/merchants"
import mongoServer from "@/config/mongoConfig"
import { verifyToken } from "@/utils/jwt"

export async function GET(req: NextRequest) {
  try {
    await mongoServer()

    const token = req.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ success: false })
    }

    const merchantId = verifyToken(token);

    if (!merchantId) {
      return NextResponse.json({ success: false })
    }

    const merchant = await Merchants.findById(merchantId).select("-password")

    if (!merchant) {
      return NextResponse.json({ success: false })
    }

    return NextResponse.json({
      success: true,
      data: merchant,
    })
  } catch {
    return NextResponse.json({ success: false })
  }
}
