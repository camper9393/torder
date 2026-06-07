import type { TableHall } from "@/types/floorLayout";

export const DEFAULT_HALL_ID = "hall-1";
export const DEFAULT_HALL_NAME = "Заал 1";

export function resolveHallId(hallId: string | undefined | null): string {
  if (typeof hallId === "string" && hallId.trim()) return hallId.trim();
  return DEFAULT_HALL_ID;
}

export function defaultHall(): TableHall {
  return { id: DEFAULT_HALL_ID, name: DEFAULT_HALL_NAME };
}

export function nextHallId(halls: TableHall[]): string {
  let max = 0;
  for (const hall of halls) {
    const match = /^hall-(\d+)$/i.exec(hall.id);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `hall-${max + 1}`;
}

export function nextHallName(halls: TableHall[]): string {
  let max = 0;
  for (const hall of halls) {
    const match = /^заал\s*(\d+)$/i.exec(hall.name.trim());
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `Заал ${max + 1}`;
}

export function sortHalls(halls: TableHall[]): TableHall[] {
  return [...halls].sort((a, b) => {
    const aMatch = /^hall-(\d+)$/i.exec(a.id);
    const bMatch = /^hall-(\d+)$/i.exec(b.id);
    if (aMatch && bMatch) {
      return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

export function hallMongoFilter(hallId: string): Record<string, unknown> {
  const id = resolveHallId(hallId);
  if (id === DEFAULT_HALL_ID) {
    return {
      $or: [
        { hallId: DEFAULT_HALL_ID },
        { hallId: { $exists: false } },
        { hallId: null },
        { hallId: "" },
      ],
    };
  }
  return { hallId: id };
}
