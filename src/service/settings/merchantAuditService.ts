import mongoServer from "@/config/mongoConfig";
import { ActivityLog } from "@/model/activityLog";
import { User } from "@/model/user";
import { serializeMerchantActivity } from "@/utils/settingsSerialize";
import mongoose, { Types } from "mongoose";

export type MerchantAuditFilters = {
  restaurantId: Types.ObjectId;
  action?: string;
  module?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export async function listMerchantAuditLogs(filters: MerchantAuditFilters) {
  await mongoServer();

  const query: Record<string, unknown> = {
    restaurantId: filters.restaurantId,
  };

  if (filters.action) query.action = filters.action;
  if (filters.module) query.module = filters.module;
  if (filters.actorUserId && mongoose.isValidObjectId(filters.actorUserId)) {
    query.actorUserId = new Types.ObjectId(filters.actorUserId);
  }

  if (filters.from || filters.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) createdAt.$gte = new Date(filters.from);
    if (filters.to) createdAt.$lte = new Date(filters.to);
    query.createdAt = createdAt;
  }

  const logs = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit ?? 100)
    .lean();

  const actorIds = [
    ...new Set(
      logs
        .map((l) => l.actorUserId)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  const actors = await User.find({ _id: { $in: actorIds } })
    .select("name")
    .lean();
  const actorMap = new Map(actors.map((a) => [String(a._id), a.name]));

  return logs.map((log) =>
    serializeMerchantActivity({
      ...log,
      actorName: log.actorUserId
        ? actorMap.get(String(log.actorUserId))
        : undefined,
    })
  );
}

export function auditLogsToCsv(
  rows: ReturnType<typeof serializeMerchantActivity>[]
): string {
  const header = [
    "Огноо",
    "Хэрэглэгч",
    "Үйлдэл",
    "Модуль",
    "Мессеж",
    "Хуучин утга",
    "Шинэ утга",
    "IP",
    "Төхөөрөмж",
  ].join(",");

  const lines = rows.map((row) =>
    [
      row.createdAt,
      row.actorName ?? "",
      row.action,
      row.module ?? "",
      `"${(row.message ?? "").replace(/"/g, '""')}"`,
      `"${(row.oldValue ?? "").replace(/"/g, '""')}"`,
      `"${(row.newValue ?? "").replace(/"/g, '""')}"`,
      row.ipAddress ?? "",
      row.device ?? "",
    ].join(",")
  );

  return [header, ...lines].join("\n");
}
