import styled from 'styled-components';

interface GlyphProps {
  src: string;
}

/** Renders a scraped icon at its own root size. */
export function Glyph({ src }: GlyphProps) {
  return <img src={src} alt="" />;
}

const Pair = styled.span`
  position: relative;
  display: block;
  width: 24px;
  height: 24px;

  img {
    position: absolute;
    inset: 0;
  }

  img[data-variant='fill'] {
    visibility: hidden;
  }

  button[data-state='active'] & img[data-variant='outline'] {
    visibility: hidden;
  }

  button[data-state='active'] & img[data-variant='fill'] {
    visibility: visible;
  }
`;

interface StateGlyphProps {
  fill: string;
  outline: string;
}

/** Outline while the row is idle, filled while it is selected. */
export function StateGlyph({ fill, outline }: StateGlyphProps) {
  return (
    <Pair>
      <img src={outline} alt="" data-variant="outline" />
      <img src={fill} alt="" data-variant="fill" />
    </Pair>
  );
}
