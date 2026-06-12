import { Transaction, TransactionStatus } from "@/model/transations";
import { Types } from "mongoose";

export async function getMostOrderedItem(merchantId: Types.ObjectId) {
  try {
    const mostOrderedItems = await Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.COMPLETED,
          merchantId: new Types.ObjectId(merchantId),
        },
      },

      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },

      { $unwind: "$order" },
      { $unwind: "$order.items" },

      {
        $group: {
          _id: "$order.items.item",
          quantity: { $sum: "$order.items.quantity" },
        },
      },

      {
        $lookup: {
          from: "menus",
          localField: "_id",
          foreignField: "_id",
          as: "menu",
        },
      },

      { $unwind: "$menu" },

      {
        $project: {
          _id: 0,
          title: "$menu.title",
          image: "$menu.image",
          quantity: 1,
        },
      },

      { $sort: { quantity: -1 } },

      { $limit: 4 },
    ]);

    return mostOrderedItems;
  } catch (error) {
    console.error("Error while getting most ordered items", error);
    return [];
  }
}
