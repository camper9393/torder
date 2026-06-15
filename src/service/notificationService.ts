import mongoServer from "@/config/mongoConfig";
import { NOTIFICATION_TYPES_BY_CATEGORY } from "@/constants/notificationCategories";
import {  Notification,
  NotificationType,
  type INotification,
} from "@/model/notification";
import { User, UserRole } from "@/model/user";
import { Types } from "mongoose";

export type CreateNotificationInput = {
  userId: Types.ObjectId | string;
  restaurantId?: Types.ObjectId | string;
  type: NotificationType | string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export function serializeNotification(doc: INotification) {
  return {
    _id: String(doc._id),
    userId: String(doc.userId),
    restaurantId: doc.restaurantId ? String(doc.restaurantId) : undefined,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    isRead: doc.isRead,
    metadata: doc.metadata ?? {},
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
  };
}

export async function createNotification(input: CreateNotificationInput) {
  await mongoServer();
  const doc = await Notification.create({
    userId: new Types.ObjectId(String(input.userId)),
    restaurantId: input.restaurantId
      ? new Types.ObjectId(String(input.restaurantId))
      : undefined,
    type: input.type,
    title: input.title.trim(),
    message: input.message.trim(),
    isRead: false,
    metadata: input.metadata,
  });
  return serializeNotification(doc.toObject() as INotification);
}

export async function notifyPlatformOwners(
  input: Omit<CreateNotificationInput, "userId">
) {
  await mongoServer();
  const owners = await User.find({
    role: UserRole.PLATFORM_OWNER,
    isActive: true,
  })
    .select("_id")
    .lean();

  const results = [];
  for (const owner of owners) {
    results.push(
      await createNotification({
        ...input,
        userId: owner._id,
      })
    );
  }
  return results;
}

export async function notifyRestaurantUsers(
  restaurantId: Types.ObjectId | string,
  input: Omit<CreateNotificationInput, "userId" | "restaurantId">
) {
  await mongoServer();
  const users = await User.find({
    restaurantId: new Types.ObjectId(String(restaurantId)),
    isActive: true,
    role: { $ne: UserRole.PLATFORM_OWNER },
  })
    .select("_id")
    .lean();

  const results = [];
  for (const user of users) {
    results.push(
      await createNotification({
        ...input,
        userId: user._id,
        restaurantId,
      })
    );
  }
  return results;
}

export async function listNotificationsForUser(
  userId: Types.ObjectId | string,
  limit = 30
) {
  await mongoServer();
  const items = await Notification.find({
    userId: new Types.ObjectId(String(userId)),
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<INotification[]>();

  return items.map(serializeNotification);
}

export async function countUnreadForUser(userId: Types.ObjectId | string) {
  await mongoServer();
  return Notification.countDocuments({
    userId: new Types.ObjectId(String(userId)),
    isRead: false,
  });
}

export async function countUnreadSupportForUser(
  userId: Types.ObjectId | string,
  role: UserRole
) {
  await mongoServer();
  const supportTypes =
    role === UserRole.PLATFORM_OWNER
      ? NOTIFICATION_TYPES_BY_CATEGORY.support
      : [];

  if (supportTypes.length === 0) return 0;

  return Notification.countDocuments({
    userId: new Types.ObjectId(String(userId)),
    isRead: false,
    type: { $in: supportTypes },
  });
}

export async function countUnreadErrorsForUser(userId: Types.ObjectId | string) {
  await mongoServer();
  return Notification.countDocuments({
    userId: new Types.ObjectId(String(userId)),
    isRead: false,
    type: { $in: NOTIFICATION_TYPES_BY_CATEGORY.errors },
  });
}
export async function countTodayForUser(userId: Types.ObjectId | string) {
  await mongoServer();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Notification.countDocuments({
    userId: new Types.ObjectId(String(userId)),
    createdAt: { $gte: start },
  });
}

export async function markNotificationRead(
  userId: Types.ObjectId | string,
  notificationId: string
) {
  await mongoServer();
  const doc = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      userId: new Types.ObjectId(String(userId)),
    },
    { $set: { isRead: true } },
    { new: true }
  ).lean<INotification | null>();

  return doc ? serializeNotification(doc) : null;
}

export async function markAllNotificationsRead(userId: Types.ObjectId | string) {
  await mongoServer();
  const result = await Notification.updateMany(
    { userId: new Types.ObjectId(String(userId)), isRead: false },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
}

export type MarkNotificationsReadOptions = {
  types: string[];
  ticketId?: string;
};

export async function markNotificationsReadByFilter(
  userId: Types.ObjectId | string,
  options: MarkNotificationsReadOptions
) {
  await mongoServer();
  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(String(userId)),
    isRead: false,
    type: { $in: options.types },
  };

  if (options.ticketId) {
    filter["metadata.ticketId"] = options.ticketId;
  }

  const result = await Notification.updateMany(filter, {
    $set: { isRead: true },
  });
  return result.modifiedCount;
}

export async function markNotificationsReadByIds(
  userId: Types.ObjectId | string,
  notificationIds: string[]
) {
  await mongoServer();
  if (notificationIds.length === 0) return 0;

  const result = await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      userId: new Types.ObjectId(String(userId)),
      isRead: false,
    },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
}

export { NotificationType };
