import mongoServer from "@/config/mongoConfig";

import { Permission } from "@/lib/permissions";
import { requirePosScope } from "@/lib/tenant";
import { resolveMerchantId } from "@/middleware/auth";

import { MQR } from "@/model/qrs";

import { TableLayout } from "@/model/tableLayout";

import { sendRJResponse } from "@/utils/api";
import { loadMerchantTableNames, renameMerchantTableReferences } from "@/utils/merchantTableCatalog";

import {

  clampFloorLayoutTable,

  layoutDocToFloorTable,

  mergeFloorLayouts,

  normalizeLegacyLayoutRow,

} from "@/utils/floorLayout";

import type { FloorLayoutTable, FloorLayoutPayload } from "@/types/floorLayout";

import {

  DUPLICATE_TABLE_NAME_MESSAGE,

  applyDuplicateDisplayLabels,

  isPendingTableId,

  normalizeTableNameKey,

  validateUniqueTableNames,

} from "@/utils/tableNameValidation";

import { resolveHallId, hallMongoFilter } from "@/utils/tableHalls";
import { ensureMerchantHalls } from "@/utils/tableHallStore";

import { NextRequest } from "next/server";

import { Types } from "mongoose";



function parsePutBody(body: unknown): {
  hallId: string;
  layouts: FloorLayoutTable[];
} | null {
  if (!body || typeof body !== "object") return null;

  const hallId = resolveHallId(
    typeof (body as { hallId?: unknown }).hallId === "string"
      ? (body as { hallId: string }).hallId
      : undefined
  );

  const layoutsRaw = (body as { layouts?: unknown }).layouts;
  if (!Array.isArray(layoutsRaw)) return null;

  const parsed: FloorLayoutTable[] = [];
  for (const row of layoutsRaw) {
    if (!row || typeof row !== "object") continue;
    const normalized = normalizeLegacyLayoutRow(row as Record<string, unknown>);
    if (normalized) {
      parsed.push({
        ...normalized,
        hallId,
      });
    }
  }

  return { hallId, layouts: parsed };
}



export async function GET(req: NextRequest) {

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



    const tableNames = await loadMerchantTableNames(merchantObjectId);

    const halls = await ensureMerchantHalls(merchantObjectId);

    const docs = await TableLayout.find({ merchantId: merchantObjectId }).lean();

    const saved = docs.map((d) =>
      layoutDocToFloorTable({
        _id: d._id,
        tableName: d.tableName,
        hallId: d.hallId,
        description: d.description,
        shape: d.shape,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
      })
    );

    const merged = mergeFloorLayouts(tableNames, saved);

    const payload: FloorLayoutPayload = {
      halls,
      layouts: merged,
    };

    return sendRJResponse({
      success: true,
      message: "Floor layout fetched",
      data: payload,
      status: 200,
    });

  } catch (error) {

    console.error("[GET /api/tables/layout] error:", error);

    return sendRJResponse({

      success: false,

      message: "Internal server error",

      status: 500,

    });

  }

}



export async function PUT(req: NextRequest) {

  try {

    await mongoServer();



    const scope = await requirePosScope(req, { permission: Permission.TABLES });

    if (scope instanceof Response) {

      return sendRJResponse({

        success: false,

        message:

          scope.status === 403

            ? "Энэ үйлдлийг хийх эрхгүй байна"

            : "Нэвтрэх шаардлагатай",

        status: scope.status,

      });

    }

    const merchantObjectId = scope.merchantId!;
    const restaurantId = scope.restaurantId;

    const body = await req.json();
    const parsed = parsePutBody(body);

    if (!parsed) {
      return sendRJResponse({
        success: false,
        message: "No valid layout data",
        status: 400,
      });
    }

    const { hallId, layouts } = parsed;



    const uniqueCheck = validateUniqueTableNames(layouts);

    if (!uniqueCheck.ok) {

      return sendRJResponse({

        success: false,

        message: uniqueCheck.message,

        status: 409,

      });

    }



    const normalizedRows = layouts.map((layout) =>
      clampFloorLayoutTable({
        ...layout,
        hallId,
      })
    );

    const savedIds: Types.ObjectId[] = [];

    const savedNames: string[] = [];



    for (const row of normalizedRows) {

      const norm = normalizeTableNameKey(row.tableName);



      if (Types.ObjectId.isValid(row.id) && !isPendingTableId(row.id)) {

        const objectId = new Types.ObjectId(row.id);

        const existing = await TableLayout.findOne({

          _id: objectId,

          merchantId: merchantObjectId,

        }).lean();



        if (!existing) {

          return sendRJResponse({

            success: false,

            message: "Table not found",

            status: 404,

          });

        }



        const conflict = await TableLayout.findOne({

          merchantId: merchantObjectId,

          normalizedTableName: norm,

          _id: { $ne: objectId },

        }).lean();



        if (conflict) {

          return sendRJResponse({

            success: false,

            message: DUPLICATE_TABLE_NAME_MESSAGE,

            status: 409,

          });

        }



        const oldName = existing.tableName;



        await TableLayout.findByIdAndUpdate(objectId, {
          $set: {
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
          },
        });



        if (oldName !== row.tableName) {

          await renameMerchantTableReferences(

            merchantObjectId,

            oldName,

            row.tableName

          );

        }



        savedIds.push(objectId);

        savedNames.push(row.tableName);

        continue;

      }



      const conflict = await TableLayout.findOne({

        merchantId: merchantObjectId,

        normalizedTableName: norm,

      }).lean();



      if (conflict) {

        return sendRJResponse({

          success: false,

          message: DUPLICATE_TABLE_NAME_MESSAGE,

          status: 409,

        });

      }



      const created = await TableLayout.create({
        merchantId: merchantObjectId,
        restaurantId: restaurantId ?? undefined,
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



      await MQR.findOneAndUpdate(

        { merchantId: merchantObjectId, name: row.tableName },

        { $setOnInsert: { merchantId: merchantObjectId, name: row.tableName } },

        { upsert: true }

      );



      savedIds.push(created._id);

      savedNames.push(row.tableName);

    }



    const removedInHall = await TableLayout.find({
      merchantId: merchantObjectId,
      ...hallMongoFilter(hallId),
      _id: { $nin: savedIds },
    })
      .select("tableName")
      .lean();

    await TableLayout.deleteMany({
      merchantId: merchantObjectId,
      ...hallMongoFilter(hallId),
      _id: { $nin: savedIds },
    });

    if (removedInHall.length > 0) {
      await MQR.deleteMany({
        merchantId: merchantObjectId,
        name: { $in: removedInHall.map((row) => row.tableName) },
      });
    }



    await Promise.all(

      savedNames.map((name) =>

        MQR.findOneAndUpdate(

          { merchantId: merchantObjectId, name },

          { $setOnInsert: { merchantId: merchantObjectId, name } },

          { upsert: true }

        )

      )

    );



    const refreshed = await TableLayout.find({
      merchantId: merchantObjectId,
      ...hallMongoFilter(hallId),
      _id: { $in: savedIds },
    }).lean();

    const halls = await ensureMerchantHalls(merchantObjectId);

    const dataLayouts = refreshed.map((d) =>
      layoutDocToFloorTable({
        _id: d._id,
        tableName: d.tableName,
        hallId: d.hallId,
        description: d.description,
        shape: d.shape,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
      })
    );

    return sendRJResponse({
      success: true,
      message: "Table layout saved",
      data: {
        halls,
        layouts: applyDuplicateDisplayLabels(dataLayouts),
      } satisfies FloorLayoutPayload,
      status: 200,
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

    console.error("[PUT /api/tables/layout] error:", error);

    return sendRJResponse({

      success: false,

      message: "Internal server error",

      status: 500,

    });

  }

}


