import styled from 'styled-components';
import { modelBadgeColor } from '../../data/modelColors';
import type { RoutingPolicy } from '../../data/routingDemo';
import { CellBadge } from '../../pages/ReportPage';
import { hostingBadgeColor } from './statusBadges';

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-150);
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 180px) minmax(0, 1fr);
  gap: var(--space-200);

  @container report-content (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Label = styled.span`
  color: var(--color-text-icon-primary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-bold);
  line-height: 1.35;
`;

const Value = styled.span`
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: 1.4;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-100);
`;

const Order = styled.p`
  margin: 0 0 var(--space-200);
  color: var(--color-text-icon-secondary);
  font-size: var(--type-size-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
`;

interface PolicyDetailProps {
  policy: RoutingPolicy;
}

/** Constraint breakdown for a policy — used inside expanded policy cards. */
export function PolicyDetail({ policy }: PolicyDetailProps) {
  return (
    <>
      <Order>
        Evaluation order: Policy lookup → Security → Governance → Cost and quality →
        Model selected
      </Order>
      <Rows>
        <Row>
          <Label>Status</Label>
          <Value>
            <CellBadge
              color={policy.status === 'Active' ? 'green' : 'disabled'}
              tone="subtle"
              dot={false}
            >
              {policy.status}
            </CellBadge>
          </Value>
        </Row>
        <Row>
          <Label>Workload scope</Label>
          <Value>{policy.scope}</Value>
        </Row>
        <Row>
          <Label>Policy priority</Label>
          <Value>{policy.priorityOrder}</Value>
        </Row>
        <Row>
          <Label>Eligible models</Label>
          <ChipRow>
            {policy.eligibleModels.map((model) => (
              <CellBadge key={model} color={modelBadgeColor(model)} tone="subtle" dot={false}>
                {model}
              </CellBadge>
            ))}
          </ChipRow>
        </Row>
        <Row>
          <Label>Eligible hosting</Label>
          <ChipRow>
            {policy.eligibleHosting.map((host) => (
              <CellBadge key={host} color={hostingBadgeColor(host)} tone="subtle" dot={false}>
                {host}
              </CellBadge>
            ))}
          </ChipRow>
        </Row>
        <Row>
          <Label>Security rules</Label>
          <Value>{policy.securityRules.join(' · ')}</Value>
        </Row>
        <Row>
          <Label>Governance rules</Label>
          <Value>{policy.governanceRules.join(' · ')}</Value>
        </Row>
        {policy.dataResidency ? (
          <Row>
            <Label>Data residency</Label>
            <Value>{policy.dataResidency}</Value>
          </Row>
        ) : null}
        <Row>
          <Label>Quality requirements</Label>
          <Value>Minimum quality ≥ {policy.qualityFloor}</Value>
        </Row>
        <Row>
          <Label>Cost preferences</Label>
          <Value>{policy.costPreference}</Value>
        </Row>
        <Row>
          <Label>Latency targets</Label>
          <Value>{policy.latencyTarget}</Value>
        </Row>
        <Row>
          <Label>Infrastructure</Label>
          <Value>{policy.infrastructureRequirement}</Value>
        </Row>
        <Row>
          <Label>Fallback behavior</Label>
          <Value>{policy.fallback}</Value>
        </Row>
        <Row>
          <Label>Last modified</Label>
          <Value>{policy.lastModified}</Value>
        </Row>
      </Rows>
    </>
  );
}
