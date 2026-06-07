import mongoServer from "@/config/mongoConfig";

import { resolveMerchantId } from "@/middleware/auth";

import { Order } from "@/model/order";

import { MQR } from "@/model/qrs";

import { TableLayout } from "@/model/tableLayout";

import { sendRJResponse } from "@/utils/api";

import {

  ACTIVE_TABLE_ORDER_STATUSES,

} from "@/utils/tableManagement";

import {

  clampFloorLayoutTable,

  createDefaultFloorTable,

  layoutDocToFloorTable,

  nextDefaultTableName,

  normalizeLegacyLayoutRow,

} from "@/utils/floorLayout";

import { resolveHallId } from "@/utils/tableHalls";

import {
  DUPLICATE_TABLE_NAME_MESSAGE,
  normalizeTableNameKey,
} from "@/utils/tableNameValidation";

import { NextRequest } from "next/server";

import { Types } from "mongoose";



export async function POST(req: NextRequest) {

  try {

    await mongoServer();



    const merchantObjectId = await resolveMerchantId(req);

    if (!merchantObjectId) {

      return sendRJResponse({

        success: false,

        message: "Unauthorized",

        status: 401,

      });

    }



    const body = await req.json();

    const existing = await TableLayout.find({ merchantId: merchantObjectId })

      .select("tableName normalizedTableName")

      .lean();

    const names = existing.map((d) => d.tableName);



    const requestedName =

      typeof body?.tableName === "string" ? body.tableName.trim() : "";

    const tableName = requestedName || nextDefaultTableName(names);



    if (!tableName) {

      return sendRJResponse({

        success: false,

        message: DUPLICATE_TABLE_NAME_MESSAGE,

        status: 400,

      });

    }



    const norm = normalizeTableNameKey(tableName);

    const duplicate = existing.some(

      (d) =>

        d.normalizedTableName === norm ||

        normalizeTableNameKey(d.tableName) === norm

    );



    if (duplicate) {

      return sendRJResponse({

        success: false,

        message: DUPLICATE_TABLE_NAME_MESSAGE,

        status: 409,

      });

    }



    const existingQr = await MQR.findOne({

      merchantId: merchantObjectId,

      name: tableName,

    });

    if (!existingQr) {

      await MQR.create({ merchantId: merchantObjectId, name: tableName });

    }



    const partial = normalizeLegacyLayoutRow({

      ...(body as Record<string, unknown>),

      tableName,

      description:

        typeof body?.description === "string" ? body.description : tableName,

      shape: body?.shape,

      x: body?.x ?? 8,

      y: body?.y ?? 10,

      width: body?.width,

      height: body?.height,

    });



    const row =

      partial ??

      createDefaultFloorTable(tableName, existing.length, names);



    const hallId = resolveHallId(
      typeof body?.hallId === "string" ? body.hallId : undefined
    );

    const doc = await TableLayout.create({
      merchantId: merchantObjectId,
      tableName: row.tableName,
      normalizedTableName: norm,
      description: row.description,
      shape: row.shape,
      color: "#4A7FE5",
      hallId,
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
    });



    return sendRJResponse({

      success: true,

      message: "Table created",

      data: layoutDocToFloorTable({
        _id: doc._id,
        tableName: doc.tableName,
        hallId: doc.hallId,
        description: doc.description,
        shape: doc.shape,
        x: doc.x,
        y: doc.y,
        width: doc.width,
        height: doc.height,
      }),

      status: 201,

    });

  } catch (error: unknown) {

    if (

      error &&

      typeof error === "object" &&

      "code" in error &&

      (error as { code: number }).code === 11000

    ) {

      return sendRJResponse({

        success: false,

        message: DUPLICATE_TABLE_NAME_MESSAGE,

        status: 409,

      });

    }

    console.error("[POST /api/tables/layout/table] error:", error);

    return sendRJResponse({

      success: false,

      message: "Internal server error",

      status: 500,

    });

  }

}



export async function DELETE(req: NextRequest) {

  try {

    await mongoServer();



    const merchantObjectId = await resolveMerchantId(req);

    if (!merchantObjectId) {

      return sendRJResponse({

        success: false,

        message: "Unauthorized",

        status: 401,

      });

    }



    const tableId = req.nextUrl.searchParams.get("tableId")?.trim();

    if (!tableId || !Types.ObjectId.isValid(tableId)) {

      return sendRJResponse({

        success: false,

        message: "tableId is required",

        status: 400,

      });

    }



    const objectId = new Types.ObjectId(tableId);

    const layout = await TableLayout.findOne({

      _id: objectId,

      merchantId: merchantObjectId,

    }).lean();



    if (!layout) {

      return sendRJResponse({

        success: false,

        message: "Table not found",

        status: 404,

      });

    }



    const tableName = layout.tableName;



    const active = await Order.countDocuments({

      merchantId: merchantObjectId,

      tableName,

      status: { $in: ACTIVE_TABLE_ORDER_STATUSES },

    });



    if (active > 0) {

      return sendRJResponse({

        success: false,

        message: "Cannot delete table with active orders",

        status: 409,

      });

    }



    await Promise.all([

      TableLayout.deleteOne({ _id: objectId, merchantId: merchantObjectId }),

      MQR.deleteOne({ merchantId: merchantObjectId, name: tableName }),

    ]);



    return sendRJResponse({

      success: true,

      message: "Table removed",

      data: { tableId, tableName },

      status: 200,

    });

  } catch (error) {

    console.error("[DELETE /api/tables/layout/table] error:", error);

    return sendRJResponse({

      success: false,

      message: "Internal server error",

      status: 500,

    });

  }

}


