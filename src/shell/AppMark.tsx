import styled from 'styled-components';
import mask from '../assets/app-mark-background.svg';
import logo from '../assets/app-mark-logo.png';
import overlay from '../assets/app-mark-overlay.svg';

const Mark = styled.span`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-150);
  /* clip-path enforces the radius even when mask compositing is flaky */
  clip-path: inset(0 round var(--radius-150));
  /*
    Squircle mask from the frame. Double-quoted so Vite’s data: SVG URLs
    (which contain single quotes) don’t invalidate the declaration.
  */
  -webkit-mask-image: url("${mask}");
  mask-image: url("${mask}");
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  mask-mode: alpha;
  /*
    Product mark gradient from the frame (indigo/50, blue/60, blue/70).
    cake& does not publish those palette steps as tokens.
  */
  background-image: linear-gradient(
    -45deg,
    rgb(80, 102, 255) 23%,
    rgb(59, 146, 249) 50%,
    rgb(117, 173, 253) 77%
  );
`;

const Logo = styled.img`
  position: absolute;
  inset: 0;
  object-fit: cover;
  border-radius: inherit;
`;

export function AppMark() {
  return (
    <Mark>
      <Logo src={logo} alt="" />
      <Logo src={overlay} alt="" />
    </Mark>
  );
}
