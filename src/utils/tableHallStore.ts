import { MQR } from "@/model/qrs";
import { TableHall as TableHallModel } from "@/model/tableHall";
import { TableLayout } from "@/model/tableLayout";
import type { TableHall } from "@/types/floorLayout";
import {
  DEFAULT_HALL_ID,
  DEFAULT_HALL_NAME,
  hallMongoFilter,
  nextHallId,
  nextHallName,
  resolveHallId,
  sortHalls,
} from "@/utils/tableHalls";
import { Types } from "mongoose";

function mapHallDoc(doc: { hallId: string; name: string }): TableHall {
  return { id: doc.hallId, name: doc.name };
}

export async function ensureMerchantHalls(
  merchantId: Types.ObjectId
): Promise<TableHall[]> {
  await TableHallModel.deleteMany({
    merchantId,
    deletedAt: { $ne: null },
  });

  let docs = await TableHallModel.find({ merchantId })
    .sort({ sortOrder: 1, hallId: 1 })
    .lean();

  if (docs.length === 0) {
    await TableHallModel.create({
      merchantId,
      hallId: DEFAULT_HALL_ID,
      name: DEFAULT_HALL_NAME,
      sortOrder: 0,
    });
    docs = await TableHallModel.find({ merchantId })
      .sort({ sortOrder: 1, hallId: 1 })
      .lean();
  }

  await TableLayout.updateMany(
    {
      merchantId,
      $or: [
        { hallId: { $exists: false } },
        { hallId: null },
        { hallId: "" },
      ],
    },
    { $set: { hallId: DEFAULT_HALL_ID } }
  );

  return sortHalls(docs.map(mapHallDoc));
}

export async function createMerchantHall(
  merchantId: Types.ObjectId
): Promise<TableHall> {
  await ensureMerchantHalls(merchantId);

  const allDocs = await TableHallModel.find({ merchantId })
    .sort({ sortOrder: 1, hallId: 1 })
    .lean();
  const allMapped = allDocs.map(mapHallDoc);
  const hallId = nextHallId(allMapped);
  const name = nextHallName(allMapped);
  const sortOrder = allDocs.length;

  const created = await TableHallModel.create({
    merchantId,
    hallId,
    name,
    sortOrder,
  });

  return mapHallDoc(created);
}

export async function deleteMerchantHall(
  merchantId: Types.ObjectId,
  hallId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const hallCount = await TableHallModel.countDocuments({ merchantId });
  if (hallCount <= 1) {
    return {
      ok: false,
      message: "Cannot delete the only remaining hall",
    };
  }

  const targetId = resolveHallId(hallId);
  const doc = await TableHallModel.findOne({
    merchantId,
    hallId: targetId,
  }).lean();

  if (!doc) {
    return { ok: false, message: "Hall not found" };
  }

  const layouts = await TableLayout.find({
    merchantId,
    ...hallMongoFilter(targetId),
  })
    .select("tableName")
    .lean();

  const tableNames = layouts.map((layout) => layout.tableName);

  await Promise.all([
    TableLayout.deleteMany({
      merchantId,
      ...hallMongoFilter(targetId),
    }),
    tableNames.length > 0
      ? MQR.deleteMany({
          merchantId,
          name: { $in: tableNames },
        })
      : Promise.resolve(),
    TableHallModel.deleteOne({ _id: doc._id }),
  ]);

  return { ok: true };
}

export function readHallIdFromDoc(doc: {
  hallId?: string | null;
}): string {
  return resolveHallId(doc.hallId);
}
