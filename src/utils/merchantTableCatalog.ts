import { Order } from "@/model/order";
import { MQR } from "@/model/qrs";
import { TableLayout } from "@/model/tableLayout";
import { createDefaultFloorTable } from "@/utils/floorLayout";
import { mergeTableNameList } from "@/utils/tableManagement";
import {
  DUPLICATE_TABLE_NAME_MESSAGE,
  normalizeTableNameKey,
} from "@/utils/tableNameValidation";
import { Types } from "mongoose";

export type MerchantTableQrRow = {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

/** QR creation order first, then layout-only names (normalized dedupe). */
export async function loadMerchantTableNames(
  merchantObjectId: Types.ObjectId
): Promise<string[]> {
  const [qrDocs, layoutDocs] = await Promise.all([
    MQR.find({ merchantId: merchantObjectId })
      .sort({ createdAt: 1 })
      .select("name")
      .lean(),
    TableLayout.find({ merchantId: merchantObjectId })
      .select("tableName")
      .lean(),
  ]);

  const qrNames = qrDocs.map((q) => q.name);
  const qrNorms = new Set(qrNames.map(normalizeTableNameKey));
  const layoutOnly = layoutDocs
    .map((d) => d.tableName)
    .filter((n) => !qrNorms.has(normalizeTableNameKey(n)));

  return mergeTableNameList(qrNames, layoutOnly);
}

/** TableLayout name wins when both exist; keeps QR + layout lists aligned. */
export async function loadMerchantTableQrList(
  merchantObjectId: Types.ObjectId
): Promise<MerchantTableQrRow[]> {
  const [qrDocs, layoutDocs] = await Promise.all([
    MQR.find({ merchantId: merchantObjectId })
      .sort({ createdAt: 1 })
      .lean(),
    TableLayout.find({ merchantId: merchantObjectId }).lean(),
  ]);

  const layoutByNorm = new Map(
    layoutDocs.map((d) => [normalizeTableNameKey(d.tableName), d])
  );
  const qrByNorm = new Map(
    qrDocs.map((q) => [normalizeTableNameKey(q.name), q])
  );

  const orderedNames = await loadMerchantTableNames(merchantObjectId);
  const rows: MerchantTableQrRow[] = [];

  for (const name of orderedNames) {
    const norm = normalizeTableNameKey(name);
    const layout = layoutByNorm.get(norm);
    const canonicalName = layout?.tableName ?? name;
    let qr = qrByNorm.get(norm);

    if (qr) {
      if (qr.name !== canonicalName) {
        await MQR.updateOne({ _id: qr._id }, { $set: { name: canonicalName } });
        qr = { ...qr, name: canonicalName };
      }
      rows.push({
        _id: qr._id,
        merchantId: qr.merchantId,
        name: canonicalName,
        createdAt: qr.createdAt,
        updatedAt: qr.updatedAt,
      });
      continue;
    }

    const created = await MQR.create({
      merchantId: merchantObjectId,
      name: canonicalName,
    });
    qrByNorm.set(norm, created);
    rows.push({
      _id: created._id,
      merchantId: created.merchantId,
      name: created.name,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  return rows;
}

/** Propagate a table rename to QR codes and open orders. */
export async function renameMerchantTableReferences(
  merchantObjectId: Types.ObjectId,
  oldName: string,
  newName: string
): Promise<void> {
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();
  if (!trimmedOld || !trimmedNew || trimmedOld === trimmedNew) return;

  const oldNorm = normalizeTableNameKey(trimmedOld);
  const newNorm = normalizeTableNameKey(trimmedNew);

  const qrExact = await MQR.updateOne(
    { merchantId: merchantObjectId, name: trimmedOld },
    { $set: { name: trimmedNew } }
  );

  if (qrExact.matchedCount === 0) {
    const qrs = await MQR.find({ merchantId: merchantObjectId })
      .select("_id name")
      .lean();
    const match = qrs.find((q) => normalizeTableNameKey(q.name) === oldNorm);
    if (match) {
      await MQR.updateOne({ _id: match._id }, { $set: { name: trimmedNew } });
    }
  }

  await Order.updateMany(
    { merchantId: merchantObjectId, tableName: trimmedOld },
    { $set: { tableName: trimmedNew } }
  );

  if (oldNorm !== newNorm) {
    const stale = await Order.find({
      merchantId: merchantObjectId,
      tableName: { $ne: trimmedNew },
    })
      .select("_id tableName")
      .lean();

    const ids = stale
      .filter((o) => normalizeTableNameKey(o.tableName) === oldNorm)
      .map((o) => o._id);

    if (ids.length > 0) {
      await Order.updateMany(
        { _id: { $in: ids } },
        { $set: { tableName: trimmedNew } }
      );
    }
  }
}

/** Create a floor-layout row when a table is added from QR Manager only. */
export async function ensureMerchantTableLayout(
  merchantObjectId: Types.ObjectId,
  tableName: string
): Promise<void> {
  const trimmed = tableName.trim();
  const norm = normalizeTableNameKey(trimmed);
  if (!norm) return;

  const exists = await TableLayout.findOne({
    merchantId: merchantObjectId,
    normalizedTableName: norm,
  }).lean();

  if (exists) return;

  const existingNames = (
    await TableLayout.find({ merchantId: merchantObjectId })
      .select("tableName")
      .lean()
  ).map((d) => d.tableName);

  const draft = createDefaultFloorTable(
    trimmed,
    existingNames.length,
    existingNames
  );

  await TableLayout.create({
    merchantId: merchantObjectId,
    tableName: trimmed,
    normalizedTableName: norm,
    description: draft.description ?? trimmed,
    shape: draft.shape,
    color: "#4A7FE5",
    x: draft.x,
    y: draft.y,
    width: draft.width,
    height: draft.height,
  });
}

export async function merchantTableNameExists(
  merchantObjectId: Types.ObjectId,
  tableName: string
): Promise<boolean> {
  const norm = normalizeTableNameKey(tableName);
  if (!norm) return false;

  const layoutHit = await TableLayout.findOne({
    merchantId: merchantObjectId,
    normalizedTableName: norm,
  })
    .select("_id")
    .lean();

  if (layoutHit) return true;

  const qrs = await MQR.find({ merchantId: merchantObjectId })
    .select("name")
    .lean();

  return qrs.some((q) => normalizeTableNameKey(q.name) === norm);
}

export { DUPLICATE_TABLE_NAME_MESSAGE };
