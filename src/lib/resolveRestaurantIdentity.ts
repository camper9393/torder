import mongoServer from "@/config/mongoConfig";
import { IROLE, Merchants } from "@/model/merchants";
import { Menu } from "@/model/menu";
import { Order } from "@/model/order";
import { Restaurant } from "@/model/restaurant";
import { TableLayout } from "@/model/tableLayout";
import { User, UserRole } from "@/model/user";
import { resolveMerchantIdForRestaurant } from "@/lib/tenant";
import { merchantMenuQuery } from "@/utils/menuMerchantScope";
import { isValidObjectId, Types } from "mongoose";

export type RestaurantIdentityDebug = {
  inputId: string;
  idRepresents: "merchants._id" | "restaurants._id" | "unknown";
  restaurantId: string | null;
  merchantId: string | null;
  consumerId: string | null;
  ownerId: string | null;
  restaurant: {
    _id: string;
    slug: string;
    email: string;
    name: string;
  } | null;
  merchant: {
    _id: string;
    name: string;
    role: string;
    uid: string;
  } | null;
  lookupAttempts: {
    restaurantById: unknown;
    merchantById: unknown;
    menuRestaurantId: string | null;
    tableLayoutRestaurantId: string | null;
    orderRestaurantId: string | null;
    restaurantBySlug: string | null;
    restaurantByOwnerId: string | null;
    restaurantByConsumerMerchantId: string | null;
  };
};

function merchantIdMatchQuery(merchantObjectId: Types.ObjectId) {
  const idHex = merchantObjectId.toHexString();
  return {
    $or: [{ merchantId: merchantObjectId }, { merchantId: idHex }],
  };
}

async function findOwnerIdForRestaurant(
  restaurantId: Types.ObjectId
): Promise<string | null> {
  const owner = await User.findOne({
    restaurantId,
    role: UserRole.RESTAURANT_OWNER,
  })
    .select("_id")
    .lean();
  return owner?._id ? String(owner._id) : null;
}

async function serializeRestaurant(restaurantId: Types.ObjectId) {
  const doc = await Restaurant.findById(restaurantId)
    .select("_id slug email name")
    .lean();
  if (!doc?._id) return null;
  return {
    _id: String(doc._id),
    slug: doc.slug,
    email: doc.email,
    name: doc.name,
  };
}

/**
 * Resolve Restaurant._id from URL param without assuming it is restaurants._id.
 * URL /consumer/[merchantId] and tablet-display/[merchantId] use Merchants._id.
 */
export async function lookupRestaurantIdentity(inputId: string): Promise<{
  restaurantId: Types.ObjectId | null;
  merchantId: Types.ObjectId | null;
  debug: RestaurantIdentityDebug;
}> {
  await mongoServer();

  console.log("merchantId:", inputId);

  const debug: RestaurantIdentityDebug = {
    inputId: inputId,
    idRepresents: "unknown",
    restaurantId: null,
    merchantId: null,
    consumerId: null,
    ownerId: null,
    restaurant: null,
    merchant: null,
    lookupAttempts: {
      restaurantById: null,
      merchantById: null,
      menuRestaurantId: null,
      tableLayoutRestaurantId: null,
      orderRestaurantId: null,
      restaurantBySlug: null,
      restaurantByOwnerId: null,
      restaurantByConsumerMerchantId: null,
    },
  };

  if (!inputId?.trim() || !isValidObjectId(inputId)) {
    return { restaurantId: null, merchantId: null, debug };
  }

  const inputObjectId = new Types.ObjectId(inputId);

  const restaurantById = await Restaurant.findById(inputObjectId)
    .select("_id slug email name")
    .lean();
  console.log("restaurant:", restaurantById);
  debug.lookupAttempts.restaurantById = restaurantById ?? null;

  if (restaurantById?._id) {
    debug.idRepresents = "restaurants._id";
    debug.restaurantId = String(restaurantById._id);
    debug.restaurant = {
      _id: String(restaurantById._id),
      slug: restaurantById.slug,
      email: restaurantById.email,
      name: restaurantById.name,
    };

    const linkedMerchantId = await resolveMerchantIdForRestaurant(
      new Types.ObjectId(String(restaurantById._id))
    );
    debug.merchantId = linkedMerchantId ? String(linkedMerchantId) : null;
    debug.ownerId = await findOwnerIdForRestaurant(
      new Types.ObjectId(String(restaurantById._id))
    );

    if (linkedMerchantId) {
      const linkedMerchant = await Merchants.findById(linkedMerchantId)
        .select("_id name role uid")
        .lean();
      if (linkedMerchant?._id) {
        debug.merchant = {
          _id: String(linkedMerchant._id),
          name: linkedMerchant.name,
          role: linkedMerchant.role,
          uid: linkedMerchant.uid,
        };
        debug.consumerId = String(linkedMerchant._id);
      }
    }

    return {
      restaurantId: new Types.ObjectId(String(restaurantById._id)),
      merchantId: linkedMerchantId,
      debug,
    };
  }

  const merchantDoc = await Merchants.findById(inputObjectId)
    .select("_id name role uid")
    .lean();
  debug.lookupAttempts.merchantById = merchantDoc ?? null;

  if (merchantDoc?._id) {
    debug.idRepresents = "merchants._id";
    debug.merchantId = String(merchantDoc._id);
    debug.merchant = {
      _id: String(merchantDoc._id),
      name: merchantDoc.name,
      role: merchantDoc.role,
      uid: merchantDoc.uid,
    };
    debug.consumerId = String(merchantDoc._id);

    const menu = await Menu.findOne(merchantMenuQuery(inputObjectId))
      .select("restaurantId")
      .lean();
    if (menu?.restaurantId) {
      debug.lookupAttempts.menuRestaurantId = String(menu.restaurantId);
    }

    const layout = await TableLayout.findOne(merchantIdMatchQuery(inputObjectId))
      .select("restaurantId")
      .lean();
    if (layout?.restaurantId) {
      debug.lookupAttempts.tableLayoutRestaurantId = String(layout.restaurantId);
    }

    const order = await Order.findOne(merchantIdMatchQuery(inputObjectId))
      .select("restaurantId")
      .lean();
    if (order?.restaurantId) {
      debug.lookupAttempts.orderRestaurantId = String(order.restaurantId);
    }

    const restaurantIdRaw =
      menu?.restaurantId ?? layout?.restaurantId ?? order?.restaurantId ?? null;

    if (!restaurantIdRaw && merchantDoc.uid?.startsWith("r-")) {
      const slug = merchantDoc.uid.slice(2).trim().toLowerCase();
      const restaurantByUid = await Restaurant.findOne({ slug })
        .select("_id slug email name")
        .lean();
      if (restaurantByUid?._id) {
        debug.lookupAttempts.restaurantBySlug = String(restaurantByUid._id);
        const restaurantObjectId = new Types.ObjectId(String(restaurantByUid._id));
        debug.restaurantId = String(restaurantObjectId);
        debug.restaurant = {
          _id: String(restaurantByUid._id),
          slug: restaurantByUid.slug,
          email: restaurantByUid.email,
          name: restaurantByUid.name,
        };
        debug.ownerId = await findOwnerIdForRestaurant(restaurantObjectId);

        console.log("[lookupRestaurantIdentity]", {
          idRepresents: debug.idRepresents,
          restaurantId: debug.restaurantId,
          merchantId: debug.merchantId,
          consumerId: debug.consumerId,
          ownerId: debug.ownerId,
        });

        return {
          restaurantId: restaurantObjectId,
          merchantId: inputObjectId,
          debug,
        };
      }
    }

    if (restaurantIdRaw) {
      const restaurantObjectId = new Types.ObjectId(String(restaurantIdRaw));
      debug.restaurantId = String(restaurantObjectId);
      debug.restaurant = await serializeRestaurant(restaurantObjectId);
      debug.ownerId = await findOwnerIdForRestaurant(restaurantObjectId);

      console.log("[lookupRestaurantIdentity]", {
        idRepresents: debug.idRepresents,
        restaurantId: debug.restaurantId,
        merchantId: debug.merchantId,
        consumerId: debug.consumerId,
        ownerId: debug.ownerId,
      });

      return {
        restaurantId: restaurantObjectId,
        merchantId: inputObjectId,
        debug,
      };
    }
  }

  const restaurantBySlug = await Restaurant.findOne({
    slug: inputId.trim().toLowerCase(),
  })
    .select("_id slug email name")
    .lean();
  if (restaurantBySlug?._id) {
    debug.lookupAttempts.restaurantBySlug = String(restaurantBySlug._id);
    debug.idRepresents = "restaurants._id";
    debug.restaurantId = String(restaurantBySlug._id);
    debug.restaurant = {
      _id: String(restaurantBySlug._id),
      slug: restaurantBySlug.slug,
      email: restaurantBySlug.email,
      name: restaurantBySlug.name,
    };
    const linkedMerchantId = await resolveMerchantIdForRestaurant(
      new Types.ObjectId(String(restaurantBySlug._id))
    );
    debug.merchantId = linkedMerchantId ? String(linkedMerchantId) : null;
    debug.ownerId = await findOwnerIdForRestaurant(
      new Types.ObjectId(String(restaurantBySlug._id))
    );
    return {
      restaurantId: new Types.ObjectId(String(restaurantBySlug._id)),
      merchantId: linkedMerchantId,
      debug,
    };
  }

  const ownerUser = await User.findOne({
    _id: inputObjectId,
    role: UserRole.RESTAURANT_OWNER,
  })
    .select("_id restaurantId")
    .lean();
  if (ownerUser?.restaurantId) {
    debug.lookupAttempts.restaurantByOwnerId = String(ownerUser.restaurantId);
    debug.ownerId = String(ownerUser._id);
    debug.restaurantId = String(ownerUser.restaurantId);
    debug.restaurant = await serializeRestaurant(
      new Types.ObjectId(String(ownerUser.restaurantId))
    );
    const linkedMerchantId = await resolveMerchantIdForRestaurant(
      new Types.ObjectId(String(ownerUser.restaurantId))
    );
    debug.merchantId = linkedMerchantId ? String(linkedMerchantId) : null;
    return {
      restaurantId: new Types.ObjectId(String(ownerUser.restaurantId)),
      merchantId: linkedMerchantId,
      debug,
    };
  }

  const consumerMerchant = await Merchants.findOne({
    _id: inputObjectId,
    role: IROLE.CONSUMER,
  })
    .select("_id")
    .lean();
  if (consumerMerchant?._id) {
    debug.lookupAttempts.restaurantByConsumerMerchantId = String(
      consumerMerchant._id
    );
    debug.consumerId = String(consumerMerchant._id);
  }

  console.log("[lookupRestaurantIdentity]", {
    idRepresents: debug.idRepresents,
    restaurantId: debug.restaurantId,
    merchantId: debug.merchantId,
    consumerId: debug.consumerId,
    ownerId: debug.ownerId,
    lookupAttempts: debug.lookupAttempts,
  });

  return {
    restaurantId: null,
    merchantId: merchantDoc?._id ? inputObjectId : null,
    debug,
  };
}
