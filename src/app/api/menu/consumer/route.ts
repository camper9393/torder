import mongoServer from "@/config/mongoConfig";
import { Merchants } from "@/model/merchants";
import { Menu } from "@/model/menu";
import { VisitorModel } from "@/model/visitors";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const merchantId = req.nextUrl.searchParams.get("merchantId");
    const userId = req.nextUrl.searchParams.get("userId");

    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const menu = await Menu.find({ merchantId })
      .sort({ createdAt: -1 })
      .lean();

    let restaurantName = "Restaurant";
    if (isValidObjectId(merchantId)) {
      const merchant = await Merchants.findById(
        new Types.ObjectId(merchantId)
      )
        .select("name")
        .lean();
      if (merchant?.name) restaurantName = merchant.name;
    }

    if (!userId || merchantId !== userId) {
      await VisitorModel.create({
        merchantId, userId: isValidObjectId(userId) ? userId: null
      })
    }

    return sendRJResponse({
      success: true,
      message: "Menu fetched successfully",
      data: { menu, restaurantName },
      status: 200,
    });
  } catch (error) {
    console.error("Error while fetching menu:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
