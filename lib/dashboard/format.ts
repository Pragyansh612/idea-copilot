import type { Idea, PriorityEnum, StatusEnum } from '@/lib/api/idea';

/** Parse API/Supabase timestamps (space-separated or ISO). */
export function parseApiDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  let s = dateString.trim();
  if (!s.includes('T')) s = s.replace(' ', 'T');
  if (/\+\d{2}$/.test(s)) s = `${s}:00`;
  if (s.endsWith('+00:00')) s = s.replace('+00:00', 'Z');
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function timeAgo(dateString: string): string {
  const d = parseApiDate(dateString);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'yesterday' : `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDate(dateString);
}

export function formatDate(dateString: string): string {
  const d = parseApiDate(dateString);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function statusLabel(status: StatusEnum): string {
  const labels: Record<StatusEnum, string> = {
    new: 'Draft',
    in_progress: 'Active',
    completed: 'Completed',
    archived: 'Archived',
    paused: 'Stalled',
  };
  return labels[status] ?? status;
}

export function statusBadge(status: StatusEnum): { text: string; kind: string } {
  if (status === 'in_progress') return { text: 'ACTIVE', kind: '' };
  if (status === 'paused') return { text: 'STALLED', kind: 'warn' };
  if (status === 'new') return { text: 'DRAFT', kind: '' };
  if (status === 'completed') return { text: 'DONE', kind: 'hot' };
  return { text: statusLabel(status).toUpperCase(), kind: '' };
}

export function priorityShort(priority: PriorityEnum): string {
  const map: Record<PriorityEnum, string> = {
    high: 'P0',
    medium: 'P1',
    low: 'P2',
  };
  return map[priority] ?? 'P1';
}

export function ideaScore(idea: Idea): number {
  const score = idea.overall_score ?? idea.progress_percentage ?? 0;
  return Math.round(Number(score) || 0);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function matchesStatusFilter(idea: Idea, filter: string): boolean {
  if (filter === 'All') return true;
  return statusLabel(idea.status) === filter;
}

export function displayName(email?: string, displayName?: string): string {
  if (displayName?.trim()) return displayName.trim();
  if (!email) return 'Founder';
  return email.split('@')[0];
}
