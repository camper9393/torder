export const PLATFORM_SUPPORT_COOKIE = "platform_support";

export type PlatformSupportPayload = {
  restaurantId: string;
  restaurantName: string;
};

export function parsePlatformSupportCookie(
  value: string | undefined | null
): PlatformSupportPayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as PlatformSupportPayload;
    if (parsed?.restaurantId && parsed?.restaurantName) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function readPlatformSupportFromDocumentCookie(): PlatformSupportPayload | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${PLATFORM_SUPPORT_COOKIE}=`;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));

  if (!match) {
    return null;
  }

  return parsePlatformSupportCookie(match.slice(prefix.length));
}
