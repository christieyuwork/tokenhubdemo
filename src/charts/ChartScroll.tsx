import styled from 'styled-components';

/**
 * Scrollport for charts. PageScroll keeps overflow-x:hidden on the page;
 * a chart min-width scrolls here inside the panel instead of crushing labels.
 */
export const ChartScroll = styled.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
`;
