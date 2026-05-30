import mongoServer from "@/config/mongoConfig";
import { WaiterCall, WaiterCallStatus } from "@/model/waiterCall";
import { sendRJResponse } from "@/utils/api";
import { isValidObjectId } from "mongoose";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await mongoServer();

    const { id } = await params;
    const { status } = await req.json();

    if (!id || !isValidObjectId(id)) {
      return sendRJResponse({
        success: false,
        message: "Valid waiter call id is required",
        status: 400,
      });
    }

    const allowed: WaiterCallStatus[] = ["new", "accepted", "done"];
    if (!allowed.includes(status)) {
      return sendRJResponse({
        success: false,
        message: "Invalid status",
        status: 400,
      });
    }

    const call = await WaiterCall.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();

    if (!call) {
      return sendRJResponse({
        success: false,
        message: "Waiter call not found",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Waiter call updated",
      data: call,
      status: 200,
    });
  } catch (error) {
    console.error("Error updating waiter call:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
