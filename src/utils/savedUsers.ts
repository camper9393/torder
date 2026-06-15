// Энэ browser/төхөөрөмж дээр нэвтэрсэн хэрэглэгчдийг localStorage-д хадгална.
// Нууц үг ЭСВЭЛ JWT token ХАДГАЛАХГҮЙ — зөвхөн аюулгүй мэдээлэл.

export type SavedUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  lastLoginAt: string;
};

const USERS_KEY = "torder.savedUsers";
const LOCK_PREFIX = "torder.passcodeLock.";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 минут

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function isUserSavedLocally(userId: string): boolean {
  if (!userId) return false;
  return getSavedUsers().some((user) => user.userId === userId);
}

export function getSavedUsers(): SavedUser[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedUser[];
    if (!Array.isArray(list)) return [];
    return list
      .filter((u) => u && u.userId && u.name)
      .sort((a, b) => (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? ""));
  } catch {
    return [];
  }
}

export function saveUser(input: {
  userId: string;
  name: string;
  email: string;
  role: string;
}): void {
  if (!isBrowser() || !input.userId) return;
  const existing = getSavedUsers().filter((u) => u.userId !== input.userId);
  const entry: SavedUser = {
    userId: input.userId,
    name: input.name,
    email: input.email,
    role: input.role,
    initials: computeInitials(input.name),
    lastLoginAt: new Date().toISOString(),
  };
  const next = [entry, ...existing].slice(0, 8);
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
  } catch {
    // localStorage дүүрсэн эсвэл хаагдсан — чимээгүй өнгөрнө
  }
}

export function removeSavedUser(userId: string): void {
  if (!isBrowser()) return;
  const next = getSavedUsers().filter((u) => u.userId !== userId);
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
    localStorage.removeItem(LOCK_PREFIX + userId);
  } catch {
    // ignore
  }
}

// ---- Pin кодын буруу оролдлогын түгжээ (browser тал) ----

type LockState = { attempts: number; lockUntil: number };

function readLock(userId: string): LockState {
  if (!isBrowser()) return { attempts: 0, lockUntil: 0 };
  try {
    const raw = localStorage.getItem(LOCK_PREFIX + userId);
    if (!raw) return { attempts: 0, lockUntil: 0 };
    const parsed = JSON.parse(raw) as LockState;
    return {
      attempts: Number(parsed.attempts) || 0,
      lockUntil: Number(parsed.lockUntil) || 0,
    };
  } catch {
    return { attempts: 0, lockUntil: 0 };
  }
}

function writeLock(userId: string, state: LockState): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(LOCK_PREFIX + userId, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/** Түгжээтэй эсэх, үлдсэн хугацаа (ms) */
export function getLockRemaining(userId: string): number {
  const { lockUntil } = readLock(userId);
  const remaining = lockUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/** Буруу оролдлого бүртгэх. Түгжигдсэн бол true буцаана. */
export function recordFailedAttempt(userId: string): {
  locked: boolean;
  remainingAttempts: number;
} {
  const state = readLock(userId);
  const attempts = state.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    writeLock(userId, { attempts, lockUntil: Date.now() + LOCK_MS });
    return { locked: true, remainingAttempts: 0 };
  }
  writeLock(userId, { attempts, lockUntil: 0 });
  return { locked: false, remainingAttempts: MAX_ATTEMPTS - attempts };
}

/** Амжилттай нэвтэрсний дараа оролдлогын тоог цэвэрлэнэ */
export function clearAttempts(userId: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(LOCK_PREFIX + userId);
  } catch {
    // ignore
  }
}
