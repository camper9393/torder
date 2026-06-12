import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import {
  buildBackupFilename,
  buildMerchantDatabaseBackup,
} from "@/utils/databaseBackup";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await mongoServer();
    const merchantId = await resolveMerchantId(req);
    if (!merchantId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const backup = await buildMerchantDatabaseBackup(merchantId);
    const filename = buildBackupFilename();
    const json = JSON.stringify(backup, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Database backup error:", error);
    return NextResponse.json(
      { success: false, message: "Backup хийхэд алдаа гарлаа" },
      { status: 500 }
    );
  }
}
