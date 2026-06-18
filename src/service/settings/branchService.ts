import mongoServer from "@/config/mongoConfig";
import { Branch, BranchStatus } from "@/model/branch";
import { serializeBranch } from "@/utils/settingsSerialize";
import mongoose, { Types } from "mongoose";

export async function listBranches(restaurantId: Types.ObjectId) {
  await mongoServer();
  const items = await Branch.find({ restaurantId })
    .sort({ createdAt: -1 })
    .lean();
  return items.map(serializeBranch);
}

export async function createBranch(
  restaurantId: Types.ObjectId,
  input: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    manager?: string;
    description?: string;
  }
) {
  await mongoServer();
  const doc = await Branch.create({
    restaurantId,
    name: input.name.trim(),
    address: input.address?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    email: input.email?.trim() ?? "",
    manager: input.manager?.trim() ?? "",
    description: input.description?.trim() ?? "",
    status: BranchStatus.ACTIVE,
  });
  return serializeBranch(doc.toObject());
}

export async function updateBranch(
  restaurantId: Types.ObjectId,
  branchId: string,
  input: Partial<{
    name: string;
    address: string;
    phone: string;
    email: string;
    manager: string;
    description: string;
    status: BranchStatus;
  }>
) {
  await mongoServer();
  if (!mongoose.isValidObjectId(branchId)) return null;

  const update: Record<string, unknown> = {};
  if (typeof input.name === "string") update.name = input.name.trim();
  if (typeof input.address === "string") update.address = input.address.trim();
  if (typeof input.phone === "string") update.phone = input.phone.trim();
  if (typeof input.email === "string") update.email = input.email.trim();
  if (typeof input.manager === "string") update.manager = input.manager.trim();
  if (typeof input.description === "string")
    update.description = input.description.trim();
  if (input.status) update.status = input.status;

  const doc = await Branch.findOneAndUpdate(
    { _id: branchId, restaurantId },
    { $set: update },
    { new: true }
  ).lean();

  return doc ? serializeBranch(doc) : null;
}

export async function deleteBranch(
  restaurantId: Types.ObjectId,
  branchId: string
) {
  await mongoServer();
  if (!mongoose.isValidObjectId(branchId)) return false;
  const result = await Branch.deleteOne({ _id: branchId, restaurantId });
  return result.deletedCount > 0;
}
