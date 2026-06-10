import mongoServer from "@/config/mongoConfig";
import { InventoryItem, type InventoryUnit } from "@/model/inventoryItem";
import { uploadToCloudinary } from "@/service/cloudnary";
import { sendRJResponse } from "@/utils/api";
import {
  parsePositiveNumber,
  requireInventoryMerchantId,
  serializeInventoryItem,
} from "@/utils/inventoryApi";
import { NextRequest } from "next/server";

const UNITS: InventoryUnit[] = ["kg", "gram", "liter", "piece"];
const SORT_FIELDS = new Set([
  "name",
  "category",
  "currentStock",
  "unitCost",
  "createdAt",
]);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();
    const merchantId = await requireInventoryMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 20)));
    const search = (params.get("search") || "").trim();
    const category = (params.get("category") || "").trim();
    const sortBy = SORT_FIELDS.has(params.get("sortBy") || "")
      ? (params.get("sortBy") as string)
      : "name";
    const sortDir = params.get("sortDir") === "desc" ? -1 : 1;

    const filter: Record<string, unknown> = { merchantId };
    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: "i" };
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    const [total, items, categories] = await Promise.all([
      InventoryItem.countDocuments(filter),
      InventoryItem.find(filter)
        .sort({ [sortBy]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      InventoryItem.distinct("category", { merchantId }),
    ]);

    return sendRJResponse({
      success: true,
      message: "Inventory items fetched",
      data: {
        items: items.map((item) => serializeInventoryItem(item)),
        total,
        page,
        limit,
        categories: (categories as string[]).filter(Boolean).sort(),
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await mongoServer();
    const merchantId = await requireInventoryMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const formData = await req.formData();
    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const unit = String(formData.get("unit") || "") as InventoryUnit;
    const notes = String(formData.get("notes") || "").trim();
    const file = formData.get("image") as File | null;

    const currentStock = parsePositiveNumber(formData.get("currentStock"), 0);
    const minimumStock = parsePositiveNumber(formData.get("minimumStock"), 0);
    const unitCost = parsePositiveNumber(formData.get("unitCost"), 0);

    if (!name || !category) {
      return sendRJResponse({
        success: false,
        message: "Нэр болон ангилал заавал",
        status: 400,
      });
    }

    if (!UNITS.includes(unit)) {
      return sendRJResponse({
        success: false,
        message: "Буруу нэгж",
        status: 400,
      });
    }

    if (
      currentStock === null ||
      minimumStock === null ||
      unitCost === null
    ) {
      return sendRJResponse({
        success: false,
        message: "Буруу тоон утга",
        status: 400,
      });
    }

    let imageUrl: string | undefined;
    if (file && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return sendRJResponse({
          success: false,
          message: "Зөвхөн зураг оруулна",
          status: 400,
        });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await uploadToCloudinary(
        buffer,
        `qr-menu/inventory/${merchantId}`
      );
    }

    const item = await InventoryItem.create({
      merchantId,
      name,
      category,
      unit,
      currentStock,
      minimumStock,
      unitCost,
      image: imageUrl,
      notes: notes || undefined,
    });

    return sendRJResponse({
      success: true,
      message: "Бараа нэмэгдлээ",
      data: serializeInventoryItem(item.toObject()),
      status: 201,
    });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
