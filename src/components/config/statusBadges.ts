import type { BadgeColor } from '@cake-admin/cakeand';

/** Map sentence-case config statuses to cake& badge colors. Labels stay in the UI. */
export function configStatusBadgeColor(status: string): BadgeColor {
  switch (status) {
    case 'Active':
    case 'Healthy':
    case 'Enabled':
    case 'On track':
    case 'Complete':
      return 'green';
    case 'Recovering':
    case 'Expiring soon':
    case 'Near limit':
    case 'Warning':
    case 'Incomplete':
    case 'Internal rate':
      return 'orange';
    case 'Degraded':
    case 'Needs attention':
    case 'Exceeded':
    case 'Unpriced':
      return 'destructive';
    case 'Disabled':
    case 'Revoked':
    case 'Superseded':
      return 'disabled';
    case 'Staging':
    case 'Development':
      return 'yellow';
    case 'Production':
      return 'cyan';
    default:
      return 'secondary';
  }
}
