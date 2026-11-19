import styled from 'styled-components';

/**
 * Lucide icon slots — two sizes only, used consistently across the app.
 *
 * - LeadIcon (24): brand / hero / splash marks (Home cards, Prompt lab banner, Lab splash).
 * - InlineIcon (16): labels, section headers, eyebrows, and the same optical size as
 *   cake& button startIcon/endIcon (`size={16}`).
 *
 * Prefer these wrappers over bare Lucide defaults (24px) next to helper text.
 */

const iconSlot = (sizePx: number) => `
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: ${sizePx}px;
  height: ${sizePx}px;
  color: inherit;

  svg {
    width: ${sizePx}px;
    height: ${sizePx}px;
  }
`;

/** Brand / hero mark — 24×24. */
export const LeadIcon = styled.span`
  ${iconSlot(24)}
`;

/** Inline label / section icon — 16×16, matches button icons. */
export const InlineIcon = styled.span`
  ${iconSlot(16)}
`;
