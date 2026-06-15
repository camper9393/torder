import type { IActivityLog } from "@/model/activityLog";
import type { IPlatformPayment } from "@/model/platformPayment";
import type { IRestaurant } from "@/model/restaurant";
import type { ISupportRequest } from "@/model/supportRequest";
import type { ISystemError } from "@/model/systemError";
import type { IUser } from "@/model/user";
import type { IPlatformSettings } from "@/model/platformSettings";
import type { PublicUser } from "@/service/userAuth";

export function toIso(value: Date | string | undefined | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function serializeRestaurant(doc: IRestaurant) {
  return {
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    ownerName: doc.ownerName,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    plan: doc.plan,
    subscriptionStatus: doc.subscriptionStatus,
    startDate: toIso(doc.startDate)!,
    expireDate: toIso(doc.expireDate)!,
    maxTables: doc.maxTables,
    maxUsers: doc.maxUsers,
    isActive: doc.isActive,
    createdAt: toIso(doc.createdAt)!,
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializePublicUser(user: PublicUser | IUser) {
  return {
    _id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId ? String(user.restaurantId) : undefined,
    permissions: [...(user.permissions ?? [])],
    isActive: user.isActive,
    createdAt: toIso(user.createdAt)!,
    updatedAt: toIso(user.updatedAt)!,
  };
}

export function serializePayment(doc: IPlatformPayment & { restaurantName?: string }) {
  return {
    _id: String(doc._id),
    restaurantId: String(doc.restaurantId),
    restaurantName: doc.restaurantName,
    amount: doc.amount,
    currency: doc.currency,
    plan: doc.plan,
    status: doc.status,
    paymentMethod: doc.paymentMethod,
    paidAt: toIso(doc.paidAt),
    dueDate: toIso(doc.dueDate)!,
    note: doc.note ?? "",
    createdAt: toIso(doc.createdAt)!,
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializeSupport(doc: ISupportRequest & { restaurantName?: string }) {
  return {
    _id: String(doc._id),
    restaurantId: String(doc.restaurantId),
    restaurantName: doc.restaurantName,
    title: doc.title,
    message: doc.message,
    type: doc.type,
    priority: doc.priority,
    status: doc.status,
    createdBy: doc.createdBy ? String(doc.createdBy) : undefined,
    assignedTo: doc.assignedTo ? String(doc.assignedTo) : undefined,
    adminNote: doc.adminNote ?? "",
    imageUrls: doc.imageUrls ?? [],
    createdAt: toIso(doc.createdAt)!,
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializeSystemError(doc: ISystemError & { restaurantName?: string }) {
  return {
    _id: String(doc._id),
    restaurantId: doc.restaurantId ? String(doc.restaurantId) : undefined,
    restaurantName: doc.restaurantName,
    level: doc.level,
    source: doc.source,
    message: doc.message,
    stack: doc.stack,
    url: doc.url,
    userId: doc.userId ? String(doc.userId) : undefined,
    resolved: doc.resolved,
    resolvedAt: toIso(doc.resolvedAt),
    createdAt: toIso(doc.createdAt)!,
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializeActivity(doc: IActivityLog & { actorName?: string; restaurantName?: string }) {
  return {
    _id: String(doc._id),
    actorUserId: doc.actorUserId ? String(doc.actorUserId) : undefined,
    actorName: doc.actorName,
    actorRole: doc.actorRole,
    restaurantId: doc.restaurantId ? String(doc.restaurantId) : undefined,
    restaurantName: doc.restaurantName,
    action: doc.action,
    targetType: doc.targetType,
    targetId: doc.targetId,
    message: doc.message,
    metadata: doc.metadata,
    createdAt: toIso(doc.createdAt)!,
  };
}

export function serializePlatformSettings(doc: IPlatformSettings) {
  return {
    _id: String(doc._id),
    platformName: doc.platformName,
    supportEmail: doc.supportEmail,
    defaultTrialDays: doc.defaultTrialDays,
    defaultMaxTables: doc.defaultMaxTables,
    defaultMaxUsers: doc.defaultMaxUsers,
    defaultPlan: doc.defaultPlan,
    currency: doc.currency,
    updatedAt: toIso(doc.updatedAt)!,
  };
}
