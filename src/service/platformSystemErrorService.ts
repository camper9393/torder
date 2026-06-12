import mongoServer from "@/config/mongoConfig";
import { Restaurant } from "@/model/restaurant";
import {
  SystemError,
  SystemErrorLevel,
  type ISystemError,
} from "@/model/systemError";
import { serializeSystemError } from "@/utils/platformSerialize";
import mongoose from "mongoose";

export type SystemErrorFilters = {
  level?: SystemErrorLevel;
  restaurantId?: string;
  resolved?: boolean;
};

export async function listSystemErrors(filters: SystemErrorFilters = {}) {
  await mongoServer();
  const query: Record<string, unknown> = {};
  if (filters.level) query.level = filters.level;
  if (filters.restaurantId && mongoose.isValidObjectId(filters.restaurantId)) {
    query.restaurantId = filters.restaurantId;
  }
  if (typeof filters.resolved === "boolean") query.resolved = filters.resolved;

  const errors = await SystemError.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const restaurantIds = [
    ...new Set(errors.map((e) => e.restaurantId).filter(Boolean).map(String)),
  ];
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
    .select("name")
    .lean();
  const nameMap = new Map(restaurants.map((r) => [String(r._id), r.name]));

  return errors.map((err) =>
    serializeSystemError({
      ...err,
      restaurantName: err.restaurantId
        ? nameMap.get(String(err.restaurantId))
        : undefined,
    } as ISystemError & { restaurantName?: string })
  );
}

export async function resolveSystemError(id: string) {
  await mongoServer();
  if (!mongoose.isValidObjectId(id)) return null;

  const err = await SystemError.findByIdAndUpdate(
    id,
    { resolved: true, resolvedAt: new Date() },
    { new: true }
  ).lean();

  if (!err) return null;

  return serializeSystemError(err as ISystemError);
}
