import { useRef, useState } from 'react';

// Which legend entry is highlighted, and the props that make an entry respond
// to hover (mouse only), keyboard focus, and taps that toggle it. A tap also
// hovers and focuses the button before its click, so the click decides from
// what was highlighted when the press began; a mouse already highlights on
// hover, so its click keeps the highlight.
export function useLegendHighlight() {
  const [highlight, setHighlight] = useState(null);
  const highlightedAtPress = useRef(undefined);

  const legendProps = (key) => ({
    'aria-pressed': highlight === key,
    onPointerEnter: (event) => event.pointerType === 'mouse' && setHighlight(key),
    onPointerLeave: (event) => event.pointerType === 'mouse' && setHighlight(null),
    onPointerDown: (event) => {
      highlightedAtPress.current = event.pointerType === 'mouse' ? null : highlight;
    },
    onFocus: () => setHighlight(key),
    onBlur: () => setHighlight(null),
    onClick: () => {
      const wasOn =
        highlightedAtPress.current === undefined ? highlight === key : highlightedAtPress.current === key;
      highlightedAtPress.current = undefined;
      setHighlight(wasOn ? null : key);
    },
  });

  return [highlight, legendProps];
}
