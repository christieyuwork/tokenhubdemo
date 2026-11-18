import type { BadgeColor } from '@cake-admin/cakeand';
import type { PolicyStageResult, RoutingStatus } from '../../data/routingDemo';

export function stageBadgeColor(result: PolicyStageResult): BadgeColor {
  if (result === 'Selected') return 'green';
  if (result === 'Restricted' || result === 'Blocked') return 'destructive';
  if (result === 'Applied') return 'indigo';
  return 'secondary';
}

export function routingStatusBadgeColor(status: RoutingStatus): BadgeColor {
  if (status === 'Selected') return 'green';
  if (status === 'Eligible') return 'cyan';
  if (
    status === 'Blocked by data policy' ||
    status === 'Data residency requirement not met'
  ) {
    return 'destructive';
  }
  if (status === 'Insufficient quality' || status === 'Infrastructure unavailable') {
    return 'orange';
  }
  if (status === 'Higher cost with no measurable benefit' || status === 'Excluded') {
    return 'secondary';
  }
  return 'yellow';
}

/** Hosting uses a separate palette from model pills (see modelColors.ts). */
export function hostingBadgeColor(hosting: string): BadgeColor {
  if (hosting === 'Public cloud') return 'azure';
  if (hosting === 'In-country') return 'amber';
  if (hosting === 'Lenovo infrastructure') return 'teal';
  if (hosting === 'Self-hosted') return 'jade';
  return 'secondary';
}
