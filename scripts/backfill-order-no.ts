/**
 * orderNo байхгүй захиалгуудад createdAt-аар YYMMDDHHmm + sequence онооно.
 * Ажиллуулах: npx tsx scripts/backfill-order-no.ts
 */
import mongoose from "mongoose";
import { Order } from "../src/model/order";
import {
  DEFAULT_ORDER_TIMEZONE,
  formatOrderMinutePrefix,
} from "../src/utils/orderNumberDisplay";

async function main() {
  const uri = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/qrmenu";
  await mongoose.connect(uri);

  const missing = await Order.find({
    $or: [{ orderNo: { $exists: false } }, { orderNo: null }, { orderNo: "" }],
  })
    .sort({ createdAt: 1 })
    .lean();

  if (missing.length === 0) {
    console.log("Backfill: orderNo байхгүй захиалга олдсонгүй.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Backfill: ${missing.length} захиалга шинэчлэгдэнэ...`);

  const used = new Set(
    (
      await Order.find({ orderNo: { $exists: true, $nin: [null, ""] } })
        .select("orderNo")
        .lean()
    ).map((row) => row.orderNo as string)
  );

  const seqByPrefix = new Map<string, number>();

  for (const doc of missing) {
    const prefix = formatOrderMinutePrefix(
      new Date(doc.createdAt),
      DEFAULT_ORDER_TIMEZONE
    );
    const scopeKey = `${String(doc.merchantId)}:${String(doc.restaurantId ?? "")}:${prefix}`;
    let seq = (seqByPrefix.get(scopeKey) ?? 0) + 1;
    seqByPrefix.set(scopeKey, seq);

    let orderNo = "";
    while (seq <= 99) {
      const candidate = `${prefix}${String(seq).padStart(2, "0")}`;
      if (!used.has(candidate)) {
        orderNo = candidate;
        used.add(candidate);
        break;
      }
      seq += 1;
      seqByPrefix.set(scopeKey, seq);
    }

    if (!orderNo) {
      console.warn(`Алгасав (sequence дууссан): ${doc._id}`);
      continue;
    }

    await Order.updateOne({ _id: doc._id }, { $set: { orderNo } });
    console.log(`${doc._id} -> ${orderNo}`);
  }

  await mongoose.disconnect();
  console.log("Backfill дууслаа.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
