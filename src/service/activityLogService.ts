import mongoServer from "@/config/mongoConfig";
import { UserRole } from "@/constants/userRoles";
import { ActivityLog } from "@/model/activityLog";
import { Restaurant } from "@/model/restaurant";
import { User } from "@/model/user";
import { serializeActivity } from "@/utils/platformSerialize";
import mongoose, { Types } from "mongoose";

export type LogActivityInput = {
  actorUserId?: Types.ObjectId;
  actorRole?: UserRole;
  restaurantId?: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  await mongoServer();
  await ActivityLog.create(input);
}

export type ActivityFilters = {
  action?: string;
  restaurantId?: string;
  actorUserId?: string;
  limit?: number;
};

export async function listActivityLogs(filters: ActivityFilters = {}) {
  await mongoServer();

  const query: Record<string, unknown> = {};
  if (filters.action) query.action = filters.action;
  if (filters.restaurantId && mongoose.isValidObjectId(filters.restaurantId)) {
    query.restaurantId = new Types.ObjectId(filters.restaurantId);
  }
  if (filters.actorUserId && mongoose.isValidObjectId(filters.actorUserId)) {
    query.actorUserId = new Types.ObjectId(filters.actorUserId);
  }

  const logs = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit ?? 100)
    .lean();

  const restaurantIds = [
    ...new Set(
      logs
        .map((l) => l.restaurantId)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];
  const actorIds = [
    ...new Set(
      logs
        .map((l) => l.actorUserId)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  const [restaurants, actors] = await Promise.all([
    Restaurant.find({ _id: { $in: restaurantIds } })
      .select("name")
      .lean(),
    User.find({ _id: { $in: actorIds } })
      .select("name")
      .lean(),
  ]);

  const restaurantMap = new Map(
    restaurants.map((r) => [String(r._id), r.name])
  );
  const actorMap = new Map(actors.map((a) => [String(a._id), a.name]));

  return logs.map((log) =>
    serializeActivity({
      ...log,
      actorName: log.actorUserId
        ? actorMap.get(String(log.actorUserId))
        : undefined,
      restaurantName: log.restaurantId
        ? restaurantMap.get(String(log.restaurantId))
        : undefined,
    } as Parameters<typeof serializeActivity>[0])
  );
}
