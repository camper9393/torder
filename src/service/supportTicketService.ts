import mongoServer from "@/config/mongoConfig";
import { logActivity } from "@/service/activityLogService";
import {
  NotificationType,
  notifyPlatformOwners,
} from "@/service/notificationService";
import { Restaurant } from "@/model/restaurant";
import { SupportMessage } from "@/model/supportMessage";
import {
  SupportPriority,
  SupportRequest,
  SupportStatus,
  SupportType,
  type ISupportRequest,
} from "@/model/supportRequest";
import { User, UserRole, type IUser } from "@/model/user";
import { serializeSupport } from "@/utils/platformSerialize";
import mongoose, { Types } from "mongoose";

export type SupportFilters = {
  status?: SupportStatus;
  type?: SupportType;
  priority?: SupportPriority;
  restaurantId?: string;
};

function serializeMessage(doc: {
  _id: unknown;
  ticketId: unknown;
  body: string;
  imageUrls?: string[];
  authorUserId: unknown;
  authorRole: string;
  isStaffReply: boolean;
  createdAt: Date | string;
  authorName?: string;
}) {
  return {
    _id: String(doc._id),
    ticketId: String(doc.ticketId),
    body: doc.body,
    imageUrls: doc.imageUrls ?? [],
    authorUserId: String(doc.authorUserId),
    authorRole: doc.authorRole,
    authorName: doc.authorName,
    isStaffReply: doc.isStaffReply,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
  };
}

async function attachRestaurantNames<T extends { restaurantId: unknown }>(
  items: T[]
) {
  const restaurantIds = [...new Set(items.map((i) => String(i.restaurantId)))];
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
    .select("name")
    .lean();
  const nameMap = new Map(restaurants.map((r) => [String(r._id), r.name]));
  return items.map((item) => ({
    ...item,
    restaurantName: nameMap.get(String(item.restaurantId)),
  }));
}

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
    .lean<ISupportRequest[]>();

  const withNames = await attachRestaurantNames(items);
  return withNames.map((item) => serializeSupport(item));
}

export async function listSupportForRestaurant(restaurantId: Types.ObjectId) {
  return listSupportRequests({ restaurantId: String(restaurantId) });
}

export async function getSupportTicketDetail(ticketId: string) {
  await mongoServer();
  if (!mongoose.isValidObjectId(ticketId)) return null;

  const ticket = await SupportRequest.findById(ticketId).lean<ISupportRequest>();
  if (!ticket) return null;

  const restaurant = await Restaurant.findById(ticket.restaurantId)
    .select("name email phone")
    .lean();

  const creator = ticket.createdBy
    ? await User.findById(ticket.createdBy).select("name email role").lean()
    : null;

  const messages = await SupportMessage.find({ ticketId: ticket._id })
    .sort({ createdAt: 1 })
    .lean();

  const authorIds = [...new Set(messages.map((m) => String(m.authorUserId)))];
  const authors = await User.find({ _id: { $in: authorIds } })
    .select("name role")
    .lean();
  const authorMap = new Map(authors.map((a) => [String(a._id), a.name]));

  return {
    ticket: serializeSupport({
      ...ticket,
      restaurantName: restaurant?.name,
    }),
    restaurant: restaurant
      ? {
          _id: String(restaurant._id),
          name: restaurant.name,
          email: restaurant.email,
          phone: restaurant.phone,
        }
      : null,
    createdByUser: creator
      ? {
          _id: String(creator._id),
          name: creator.name,
          email: creator.email,
          role: creator.role,
        }
      : null,
    messages: messages.map((m) =>
      serializeMessage({
        ...m,
        authorName: authorMap.get(String(m.authorUserId)),
      })
    ),
  };
}

export async function createSupportRequest(
  actor: IUser,
  input: {
    restaurantId: string;
    title: string;
    message: string;
    type?: SupportType;
    priority?: SupportPriority;
    imageUrls?: string[];
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
    type: input.type ?? SupportType.TECHNICAL,
    priority: input.priority ?? SupportPriority.MEDIUM,
    status: SupportStatus.NEW,
    createdBy: actor._id,
    imageUrls: input.imageUrls ?? [],
  });

  await SupportMessage.create({
    ticketId: ticket._id,
    body: input.message.trim(),
    imageUrls: input.imageUrls ?? [],
    authorUserId: actor._id,
    authorRole: actor.role,
    isStaffReply: actor.role === UserRole.PLATFORM_OWNER,
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

  if (actor.role !== UserRole.PLATFORM_OWNER) {
    await notifyPlatformOwners({
      type: NotificationType.SUPPORT_NEW,
      title: "Шинэ support хүсэлт",
      message: `${restaurant.name}: ${ticket.title}`,
      metadata: { ticketId: String(ticket._id), restaurantId: String(restaurant._id) },
    });
  }

  return serializeSupport({
    ...ticket.toObject(),
    restaurantName: restaurant.name,
  });
}

export async function createSupportRequestForActorRestaurant(
  actor: IUser,
  input: {
    title: string;
    message: string;
    type?: SupportType;
    priority?: SupportPriority;
    imageUrls?: string[];
  }
) {
  if (!actor.restaurantId) {
    throw new Error("Ресторанд хамаарахгүй хэрэглэгч");
  }
  return createSupportRequest(actor, {
    ...input,
    restaurantId: String(actor.restaurantId),
  });
}

export async function addSupportMessage(
  actor: IUser,
  ticketId: string,
  input: { body: string; imageUrls?: string[] }
) {
  await mongoServer();
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new Error("Буруу ticket ID");
  }

  const body = input.body.trim();
  if (!body && !(input.imageUrls?.length ?? 0)) {
    throw new Error("Мессеж хоосон байна");
  }

  const ticket = await SupportRequest.findById(ticketId);
  if (!ticket) throw new Error("Хүсэлт олдсонгүй");

  const isStaff = actor.role === UserRole.PLATFORM_OWNER;

  if (!isStaff) {
    if (!actor.restaurantId || String(actor.restaurantId) !== String(ticket.restaurantId)) {
      throw new Error("Энэ хүсэлтэд хариулах эрхгүй");
    }
  }

  const message = await SupportMessage.create({
    ticketId: ticket._id,
    body: body || "(зураг)",
    imageUrls: input.imageUrls ?? [],
    authorUserId: actor._id,
    authorRole: actor.role,
    isStaffReply: isStaff,
  });

  if (isStaff) {
    if (ticket.status === SupportStatus.NEW) {
      ticket.status = SupportStatus.IN_PROGRESS;
    }
  } else {
    ticket.status = SupportStatus.WAITING;
    await notifyPlatformOwners({
      type: NotificationType.SUPPORT_REPLY,
      title: "Support хариулт ирлээ",
      message: ticket.title,
      metadata: { ticketId: String(ticket._id), restaurantId: String(ticket.restaurantId) },
    });
  }

  await ticket.save();

  const author = await User.findById(actor._id).select("name").lean();

  return serializeMessage({
    ...message.toObject(),
    authorName: author?.name,
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

export async function countNewSupportToday() {
  await mongoServer();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return SupportRequest.countDocuments({ createdAt: { $gte: start } });
}

export async function countUnresolvedSupport() {
  await mongoServer();
  return SupportRequest.countDocuments({
    status: { $in: [SupportStatus.NEW, SupportStatus.IN_PROGRESS, SupportStatus.WAITING] },
  });
}
