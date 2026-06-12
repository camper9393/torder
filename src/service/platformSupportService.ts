import mongoServer from "@/config/mongoConfig";
import { logActivity } from "@/service/activityLogService";
import { Restaurant } from "@/model/restaurant";
import {
  SupportPriority,
  SupportRequest,
  SupportStatus,
  SupportType,
  type ISupportRequest,
} from "@/model/supportRequest";
import { IUser } from "@/model/user";
import { serializeSupport } from "@/utils/platformSerialize";
import mongoose, { Types } from "mongoose";

export type SupportFilters = {
  status?: SupportStatus;
  type?: SupportType;
  priority?: SupportPriority;
  restaurantId?: string;
};

export async function listSupportRequests(filters: SupportFilters = {}) {
  await mongoServer();
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.priority) query.priority = filters.priority;
  if (filters.restaurantId && mongoose.isValidObjectId(filters.restaurantId)) {
    query.restaurantId = new Types.ObjectId(filters.restaurantId);
  }

  const items = await SupportRequest.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const restaurantIds = [...new Set(items.map((i) => String(i.restaurantId)))];
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
    .select("name")
    .lean();
  const nameMap = new Map(restaurants.map((r) => [String(r._id), r.name]));

  return items.map((item) =>
    serializeSupport({
      ...item,
      restaurantName: nameMap.get(String(item.restaurantId)),
    } as ISupportRequest & { restaurantName?: string })
  );
}

export async function createSupportRequest(
  actor: IUser,
  input: {
    restaurantId: string;
    title: string;
    message: string;
    type?: SupportType;
    priority?: SupportPriority;
  }
) {
  await mongoServer();
  if (!mongoose.isValidObjectId(input.restaurantId)) {
    throw new Error("Буруу рестораны ID");
  }

  const restaurant = await Restaurant.findById(input.restaurantId);
  if (!restaurant) throw new Error("Ресторан олдсонгүй");

  const ticket = await SupportRequest.create({
    restaurantId: restaurant._id,
    title: input.title.trim(),
    message: input.message.trim(),
    type: input.type ?? SupportType.QUESTION,
    priority: input.priority ?? SupportPriority.MEDIUM,
    status: SupportStatus.NEW,
    createdBy: actor._id,
  });

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    restaurantId: restaurant._id,
    action: "support.created",
    targetType: "support_request",
    targetId: String(ticket._id),
    message: `Support үүсгэв: ${ticket.title}`,
  });

  return serializeSupport({
    ...ticket.toObject(),
    restaurantName: restaurant.name,
  });
}

export async function updateSupportRequest(
  actor: IUser,
  id: string,
  input: { status?: SupportStatus; adminNote?: string; priority?: SupportPriority }
) {
  await mongoServer();
  if (!mongoose.isValidObjectId(id)) return null;

  const ticket = await SupportRequest.findById(id);
  if (!ticket) return null;

  if (input.status) ticket.status = input.status;
  if (typeof input.adminNote === "string") ticket.adminNote = input.adminNote;
  if (input.priority) ticket.priority = input.priority;

  await ticket.save();

  const restaurant = await Restaurant.findById(ticket.restaurantId).select("name").lean();

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    restaurantId: ticket.restaurantId,
    action: "support.updated",
    targetType: "support_request",
    targetId: String(ticket._id),
    message: `Support төлөв: ${ticket.status}`,
  });

  return serializeSupport({
    ...ticket.toObject(),
    restaurantName: restaurant?.name,
  });
}
