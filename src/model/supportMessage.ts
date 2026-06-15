import mongoose from "mongoose";

export interface ISupportMessage {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  body: string;
  imageUrls: string[];
  authorUserId: mongoose.Types.ObjectId;
  authorRole: string;
  isStaffReply: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supportMessageSchema = new mongoose.Schema<ISupportMessage>(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "support_requests",
      required: true,
      index: true,
    },
    body: { type: String, required: true, trim: true },
    imageUrls: { type: [String], default: [] },
    authorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    authorRole: { type: String, required: true, trim: true },
    isStaffReply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

supportMessageSchema.index({ ticketId: 1, createdAt: 1 });

export const SupportMessage =
  mongoose.models.support_messages ||
  mongoose.model<ISupportMessage>("support_messages", supportMessageSchema);
