import alerts from '../assets/nav-alerts.svg';
import administration from '../assets/nav-administration.svg';
import cost from '../assets/nav-cost.svg';
import dashboardFill from '../assets/nav-dashboard-fill.svg';
import dashboardOutline from '../assets/nav-dashboard-outline.svg';
import exploreFill from '../assets/nav-explore-fill.svg';
import exploreOutline from '../assets/nav-explore-outline.svg';
import operations from '../assets/nav-operations.svg';
import optimization from '../assets/nav-optimization.svg';

export interface NavItem {
  value: string;
  label: string;
}

export interface NavLink extends NavItem {
  icon: string;
  iconFill?: string;
  iconOutline?: string;
}

export interface NavGroup extends NavLink {
  items: NavItem[];
}

export const topLinks: NavLink[] = [
  {
    value: 'dashboard',
    label: 'Dashboard',
    icon: dashboardOutline,
    iconFill: dashboardFill,
    iconOutline: dashboardOutline,
  },
  {
    value: 'home',
    label: 'Explore',
    icon: exploreOutline,
    iconFill: exploreFill,
    iconOutline: exploreOutline,
  },
];

export const navGroups: NavGroup[] = [
  {
    value: 'cost',
    label: 'Cost',
    icon: cost,
    items: [
      { value: 'cost-by-model', label: 'Cost by model' },
      { value: 'cost-by-trace', label: 'Cost by trace' },
      { value: 'invoice-reconciliation', label: 'Invoice reconciliation' },
      { value: 'pricing-and-rates', label: 'Pricing and rates' },
    ],
  },
  {
    value: 'optimization',
    label: 'Optimization',
    icon: optimization,
    items: [
      { value: 'intelligent-routing', label: 'Intelligent routing' },
      { value: 'routing-rules', label: 'Routing rules' },
      { value: 'model-analyzer', label: 'Model analyzer' },
      { value: 'caching', label: 'Caching' },
      { value: 'energy', label: 'Energy' },
    ],
  },
  {
    value: 'operations',
    label: 'Operations',
    icon: operations,
    items: [
      { value: 'model-registry', label: 'Model registry' },
      { value: 'model-deployments', label: 'Model deployments' },
      { value: 'gpu-fleet', label: 'GPU fleet' },
      { value: 'gpu-registry', label: 'GPU registry' },
    ],
  },
  {
    value: 'alerts',
    label: 'Alerts',
    icon: alerts,
    items: [
      { value: 'alert-list', label: 'Alerts' },
      { value: 'alert-rules', label: 'Alert rules' },
    ],
  },
  {
    value: 'administration',
    label: 'Administration',
    icon: administration,
    items: [
      { value: 'connections', label: 'Connections' },
      { value: 'access-keys', label: 'Access keys' },
      { value: 'quotas', label: 'Quotas' },
    ],
  },
];
