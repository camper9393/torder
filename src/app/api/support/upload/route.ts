import { requireAuth } from "@/lib/auth";
import { uploadToCloudinary } from "@/service/cloudnary";
import { sendRJResponse } from "@/utils/api";
import { NextRequest } from "next/server";

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const formData = await req.formData();
    const files = formData.getAll("images").filter((f) => f instanceof File) as File[];

    if (files.length === 0) {
      return sendRJResponse({
        success: false,
        message: "Зураг сонгоно уу",
        status: 400,
      });
    }

    if (files.length > MAX_FILES) {
      return sendRJResponse({
        success: false,
        message: `Хамгийн ихдээ ${MAX_FILES} зураг`,
        status: 400,
      });
    }

    const urls: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return sendRJResponse({
          success: false,
          message: "Зөвхөн JPG, PNG, WEBP зураг",
          status: 400,
        });
      }
      if (file.size > MAX_SIZE) {
        return sendRJResponse({
          success: false,
          message: "Зураг 5MB-аас бага байх ёстой",
          status: 400,
        });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadToCloudinary(buffer, "support");
      urls.push(url);
    }

    return sendRJResponse({
      success: true,
      message: "Зураг амжилттай хадгалагдлаа",
      data: { urls },
    });
  } catch (error) {
    console.error("POST /api/support/upload error:", error);
    return sendRJResponse({
      success: false,
      message: "Зураг хадгалахад алдаа гарлаа",
      status: 500,
    });
  }
}
