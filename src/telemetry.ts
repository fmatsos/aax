export interface PartnerAudit {
  risk: 'safe' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  alerts?: number;
  score?: number;
  analyzedAt: string;
}

export type SkillAuditData = Record<string, PartnerAudit>;
export type AuditResponse = Record<string, SkillAuditData>;

export function setVersion(_version: string): void {}

export async function fetchAuditData(
  _source: string,
  _skillSlugs: string[],
  _timeoutMs?: number
): Promise<AuditResponse | null> {
  return null;
}

export function track(_data: Record<string, string>): void {}
