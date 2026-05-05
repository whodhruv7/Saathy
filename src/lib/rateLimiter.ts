export interface UserQuotas {
  allInLord: number;      // 2 per 24h
  webDive: number;          // 3 per 24h
  deepDive: number;         // 3 per 24h
  normalQueries: number;    // 30 per 24h
  resetAt: number;          // Unix timestamp
}

const DEFAULT_QUOTAS: UserQuotas = {
  allInLord: 2,
  webDive: 3,
  deepDive: 3,
  normalQueries: 30,
  resetAt: Date.now() + 24 * 60 * 60 * 1000,
};

export async function getUserQuotas(email: string): Promise<UserQuotas> {
  try {
    const stored = localStorage.getItem(`quotas-${email}`);
    if (!stored) return { ...DEFAULT_QUOTAS, resetAt: Date.now() + 24 * 60 * 60 * 1000 };

    const quotas: UserQuotas = JSON.parse(stored);
    
    // Reset if 24h passed
    if (Date.now() > quotas.resetAt) {
      return { ...DEFAULT_QUOTAS, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
    }

    return quotas;
  } catch {
    return { ...DEFAULT_QUOTAS, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
  }
}

export async function canMakePipelineCall(email: string, mode: string): Promise<{ allowed: boolean; reason?: string }> {
  const quotas = await getUserQuotas(email);

  if (mode === 'allinlord') {
    if (quotas.allInLord <= 0) return { allowed: false, reason: 'All-In-Lord limit reached (2 per day)' };
  } else if (mode === 'webdive') {
    if (quotas.webDive <= 0) return { allowed: false, reason: 'WebDive limit reached (3 per day)' };
  } else if (mode === 'deepdive') {
    if (quotas.deepDive <= 0) return { allowed: false, reason: 'DeepDive limit reached (3 per day)' };
  } else if (mode === 'normal') {
    if (quotas.normalQueries <= 0) return { allowed: false, reason: 'Daily query limit reached (30 per day)' };
  }

  return { allowed: true };
}

export async function decrementQuota(email: string, mode: string) {
  const quotas = await getUserQuotas(email);

  if (mode === 'allinlord') quotas.allInLord--;
  else if (mode === 'webdive') quotas.webDive--;
  else if (mode === 'deepdive') quotas.deepDive--;
  else if (mode === 'normal') quotas.normalQueries--;

  localStorage.setItem(`quotas-${email}`, JSON.stringify(quotas));
}

export function getQuotaDisplay(quotas: UserQuotas): string {
  const total = quotas.allInLord + quotas.webDive + quotas.deepDive + quotas.normalQueries;
  const hours = Math.ceil((quotas.resetAt - Date.now()) / (60 * 60 * 1000));
  return `${total} queries remaining (reset in ${hours}h)`;
}
