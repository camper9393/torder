export type PixelCrop = {
  x: number
  y: number
  width: number
  height: number
}

export const MENU_IMAGE_OUTPUT_SIZE = 1200

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () => reject(new Error("Зураг ачааллахад алдаа гарлаа")))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })
}

/** Export a square JPEG from crop pixels (1:1). */
export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: PixelCrop,
  fileName: string,
  outputSize = MENU_IMAGE_OUTPUT_SIZE
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Canvas дэмжигдэхгүй байна")
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Зураг crop хийхэд алдаа гарлаа"))
          return
        }
        const safeName = fileName.replace(/\.[^.]+$/, "") || "menu-image"
        resolve(
          new File([blob], `${safeName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          })
        )
      },
      "image/jpeg",
      0.92
    )
  })
}

export function revokeBlobUrl(url: string | null | undefined) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}
