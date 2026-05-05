// Per-user daily caps enforced via localStorage (custom auth system)
// Modes here are the *billable buckets* — not every UI sub-mode. We map UI sub-modes onto these.
import { getSession } from "@/lib/supabaseAuth";

export type CapBucket = "normal" | "websearch" | "deepsearch" | "lord";

export const DAILY_CAPS: Record<CapBucket, number> = {
  normal: 30,
  websearch: 3,
  deepsearch: 3,
  lord: 2,
};

/** Map a UI sub-mode / action to a cap bucket. */
export function bucketFor(opts: {
  appMode?: "normal" | "research";
  subMode?: string;
  action?: string;
}): CapBucket {
  const { appMode, subMode } = opts;
  if (appMode !== "research") return "normal";
  if (subMode === "lord") return "lord";
  if (subMode === "webdive") return "websearch";
  if (subMode === "deepdive" || subMode === "pipeline") return "deepsearch";
  return "normal";
}

export interface UsageResult {
  allowed: boolean;
  newCount: number;
  cap: number;
  resetAt: string; // ISO
}

function getUsageKey(userEmail: string, bucket: CapBucket): string {
  return `saathy_usage_${userEmail}_${bucket}`;
}

/**
 * Atomically increment the user's daily counter for `bucket` using localStorage.
 * Returns allowed=false when the cap is hit (no work should proceed).
 */
export async function checkAndIncrementUsage(bucket: CapBucket): Promise<UsageResult> {
  const cap = DAILY_CAPS[bucket];
  const session = getSession();
  const userEmail = session?.user?.email;
  
  if (!userEmail) {
    // No session, allow but don't count
    return { allowed: true, newCount: 0, cap, resetAt: new Date(Date.now() + 86400_000).toISOString() };
  }

  const key = getUsageKey(userEmail, bucket);
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours

  // Get existing usage data
  const stored = localStorage.getItem(key);
  let count = 0;
  let windowStart = now;

  if (stored) {
    try {
      const data = JSON.parse(stored);
      windowStart = data.windowStart || now;
      count = data.count || 0;

      // Reset if window expired
      if (now - windowStart > windowMs) {
        count = 0;
        windowStart = now;
      }
    } catch {
      count = 0;
      windowStart = now;
    }
  }

  // Check cap
  if (count >= cap) {
    return { 
      allowed: false, 
      newCount: count, 
      cap, 
      resetAt: new Date(windowStart + windowMs).toISOString() 
    };
  }

  // Increment
  count++;
  localStorage.setItem(key, JSON.stringify({ count, windowStart }));

  return { 
    allowed: true, 
    newCount: count, 
    cap, 
    resetAt: new Date(windowStart + windowMs).toISOString() 
  };
}

export function formatResetWindow(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "the next reset";
  }
}
