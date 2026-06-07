import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Menu } from "@/model/menu";
import {
  MUJIN_MENU_ITEMS,
  MUJIN_MENU_SECTIONS,
  toMenuDocument,
} from "@/data/mujinMenuSeed";
import { sendRJResponse } from "@/utils/api";
import { merchantMenuQuery } from "@/utils/menuMerchantScope";
import { NextRequest } from "next/server";

export type MujinSeedResult = {
  merchantId: string;
  insertedCount: number;
  deletedCount: number;
  totalSeedItems: number;
  foundAfterInsert: number;
  foundAllMenuItems: number;
  replace: boolean;
};

/** Import Mujin Korean Restaurant menu into the logged-in merchant account. */
export async function POST(req: NextRequest) {
  try {
    await mongoServer();

    const merchantObjectId = await resolveMerchantId(req);
    if (!merchantObjectId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized — sign in as merchant first",
        status: 401,
      });
    }

    const merchantId = merchantObjectId.toHexString();
    const replace = req.nextUrl.searchParams.get("replace") === "true";
    const totalSeedItems = MUJIN_MENU_ITEMS.length;

    let deletedCount = 0;
    if (replace) {
      const del = await Menu.deleteMany(
        merchantMenuQuery(merchantObjectId, {
          section: { $in: MUJIN_MENU_SECTIONS },
        })
      );
      deletedCount = del.deletedCount ?? 0;
    }

    let docs = MUJIN_MENU_ITEMS.map((item) => toMenuDocument(item));

    if (!replace) {
      const existingTitles = new Set(
        (
          await Menu.find(
            merchantMenuQuery(merchantObjectId, {
              section: { $in: MUJIN_MENU_SECTIONS },
            })
          )
            .select("title")
            .lean()
        ).map((d) => d.title)
      );
      docs = docs.filter((doc) => !existingTitles.has(doc.title));
    }

    let insertedCount = 0;
    if (docs.length > 0) {
      const inserted = await Menu.insertMany(
        docs.map((doc) => ({
          ...doc,
          merchantId: merchantObjectId,
        })),
        { ordered: false }
      );
      insertedCount = inserted.length;
    }

    const foundAfterInsert = await Menu.countDocuments(
      merchantMenuQuery(merchantObjectId, {
        section: { $in: MUJIN_MENU_SECTIONS },
      })
    );

    const foundAllMenuItems = await Menu.countDocuments(
      merchantMenuQuery(merchantObjectId)
    );

    const payload: MujinSeedResult = {
      merchantId,
      insertedCount,
      deletedCount,
      totalSeedItems,
      foundAfterInsert,
      foundAllMenuItems,
      replace,
    };

    console.info("[seed-mujin]", payload);

    return sendRJResponse({
      success: true,
      message: `Imported ${insertedCount} items; ${foundAfterInsert} Mujin items in DB for merchant ${merchantId}`,
      data: payload,
      status: insertedCount > 0 ? 201 : 200,
    });
  } catch (error) {
    console.error("Mujin menu seed error:", error);
    return sendRJResponse({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to seed menu",
      status: 500,
    });
  }
}
