// The pastries the bakery card's oven bakes, a different one each batch. Each
// sits on the oven's tray (its bottom at y = 83, centred on x = 80, in the
// oven scene's 160 x 112 box) and is a list of SVG shapes: a tag and its
// attributes, in React's spelling. shadow is the half-width of the soft shadow
// it casts on the tray; transform, if any, applies to the whole pastry.
// Each also has a raw phase, before the oven bakes it: its colours swapped for
// the paler ones in RAW_COLORS, and its toppings (marked topping: icing,
// and butter) not on yet.
const GOLD = '#E3B655';
const CRUST = '#C9973D';
const LINE = { stroke: CRUST, strokeWidth: 1.6, strokeLinecap: 'round', fill: 'none' };
const BAKED = { fill: GOLD, stroke: CRUST, strokeWidth: 1.8, strokeLinejoin: 'round' };
// A brezel's dough rope: a darker edge under a lighter top.
const ROPE_EDGE = {
  fill: 'none',
  stroke: '#8C5022',
  strokeWidth: 5.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
const ROPE = { fill: 'none', stroke: '#C47E3E', strokeWidth: 3.2, strokeLinecap: 'round', strokeLinejoin: 'round' };

// Baked colours and their raw dough.
export const RAW_COLORS = {
  [GOLD]: '#F4E7C8',
  [CRUST]: '#DECA9E',
  '#C47E3E': '#EEDDBB',
  '#8C5022': '#D3BD93',
  '#F6E2B3': '#FBF4E2',
  '#BF8638': '#E4D2AA',
  '#E2C48A': '#ECDFC4',
  '#A87A35': '#E6D2AC',
};

export const PASTRIES = [
  {
    name: 'a fresh loaf',
    shadow: 17,
    shapes: [
      { tag: 'path', d: 'M64 83c0-12 7-18 16-18s16 6 16 18z', ...BAKED },
      { tag: 'path', d: 'M72 71l4 5M79 69l4 5M86 71l4 5', ...LINE },
    ],
  },
  {
    name: 'a croissant',
    shadow: 21,
    shapes: [
      { tag: 'ellipse', cx: 60.8, cy: 80.4, rx: 4, ry: 2.6, transform: 'rotate(-35 60.8 80.4)', ...BAKED },
      { tag: 'ellipse', cx: 99.2, cy: 80.4, rx: 4, ry: 2.6, transform: 'rotate(35 99.2 80.4)', ...BAKED },
      { tag: 'ellipse', cx: 66, cy: 78.6, rx: 5.6, ry: 4.2, transform: 'rotate(-25 66 78.6)', ...BAKED },
      { tag: 'ellipse', cx: 94, cy: 78.6, rx: 5.6, ry: 4.2, transform: 'rotate(25 94 78.6)', ...BAKED },
      { tag: 'ellipse', cx: 72.6, cy: 77, rx: 6.4, ry: 5.6, transform: 'rotate(-12 72.6 77)', ...BAKED },
      { tag: 'ellipse', cx: 87.4, cy: 77, rx: 6.4, ry: 5.6, transform: 'rotate(12 87.4 77)', ...BAKED },
      { tag: 'ellipse', cx: 80, cy: 76.2, rx: 6.6, ry: 6.8, transform: 'rotate(0 80 76.2)', ...BAKED },
    ],
  },
  {
    name: 'a brezel',
    shadow: 19,
    shapes: [
      {
        tag: 'path',
        d: 'M80 66C76 60 63 58.5 62 67C61.2 74 64 80 71 81H89C96 80 98.8 74 98 67C97 58.5 84 60 80 66',
        ...ROPE_EDGE,
      },
      {
        tag: 'path',
        d: 'M80 66C76 60 63 58.5 62 67C61.2 74 64 80 71 81H89C96 80 98.8 74 98 67C97 58.5 84 60 80 66',
        ...ROPE,
      },
      { tag: 'path', d: 'M86 61.5C82 64.5 77 71 72.5 79.5', ...ROPE_EDGE },
      { tag: 'path', d: 'M86 61.5C82 64.5 77 71 72.5 79.5', ...ROPE },
      { tag: 'path', d: 'M74 61.5C78 64.5 83 71 87.5 79.5', ...ROPE_EDGE },
      { tag: 'path', d: 'M74 61.5C78 64.5 83 71 87.5 79.5', ...ROPE },
      { tag: 'ellipse', cx: 67, cy: 63, rx: 0.95, ry: 0.7, fill: 'white' },
      { tag: 'ellipse', cx: 93, cy: 63, rx: 0.95, ry: 0.7, fill: 'white' },
      { tag: 'ellipse', cx: 80, cy: 80.8, rx: 0.95, ry: 0.7, fill: 'white' },
      { tag: 'ellipse', cx: 73, cy: 74.5, rx: 0.95, ry: 0.7, fill: 'white' },
      { tag: 'ellipse', cx: 87, cy: 74.5, rx: 0.95, ry: 0.7, fill: 'white' },
      { tag: 'ellipse', cx: 64, cy: 72.5, rx: 0.95, ry: 0.7, fill: 'white' },
      { tag: 'ellipse', cx: 96, cy: 72.5, rx: 0.95, ry: 0.7, fill: 'white' },
    ],
  },
  {
    name: 'toast',
    shadow: 13,
    shapes: [
      {
        tag: 'path',
        d: 'M68.5 83V70.5c-3.5-.8-4.5-5.4-1.8-8.2 2.6-2.8 7-3 9.5-1.6 1.2-.8 2.4-1.2 3.8-1.2s2.6.4 3.8 1.2c2.5-1.4 6.9-1.2 9.5 1.6 2.7 2.8 1.7 7.4-1.8 8.2V83z',
        fill: '#F6E2B3',
        stroke: '#BF8638',
        strokeWidth: 2.4,
        strokeLinejoin: 'round',
      },
      {
        tag: 'rect',
        x: 75.2,
        y: 65.4,
        width: 9.6,
        height: 6.4,
        rx: 1.6,
        transform: 'rotate(-6 80 68.6)',
        topping: true,
        fill: '#FBE7A1',
        stroke: '#E8C96A',
        strokeWidth: 1,
      },
      {
        tag: 'path',
        d: 'M77 67.4h3.4',
        transform: 'rotate(-6 80 68.6)',
        topping: true,
        stroke: 'white',
        strokeWidth: 0.9,
        strokeLinecap: 'round',
      },
      { tag: 'circle', cx: 72.5, cy: 75, r: 0.7, fill: '#E2C48A' },
      { tag: 'circle', cx: 76, cy: 78.5, r: 0.7, fill: '#E2C48A' },
      { tag: 'circle', cx: 84.5, cy: 74.5, r: 0.7, fill: '#E2C48A' },
      { tag: 'circle', cx: 87.5, cy: 78.8, r: 0.7, fill: '#E2C48A' },
      { tag: 'circle', cx: 80.5, cy: 80, r: 0.7, fill: '#E2C48A' },
    ],
  },
  {
    name: 'cookies',
    shadow: 22,
    shapes: [
      { tag: 'path', d: 'M59 83c0-6 4-9 10-9s10 3 10 9z', ...BAKED },
      { tag: 'path', d: 'M81 83c0-6 4-9 10-9s10 3 10 9z', ...BAKED },
      { tag: 'circle', cx: 65, cy: 79, r: 1.2, fill: '#7A5130' },
      { tag: 'circle', cx: 72, cy: 78, r: 1.2, fill: '#7A5130' },
      { tag: 'circle', cx: 87, cy: 78.5, r: 1.2, fill: '#7A5130' },
      { tag: 'circle', cx: 94, cy: 79.5, r: 1.2, fill: '#7A5130' },
    ],
  },
  {
    name: 'a blueberry muffin',
    shadow: 12,
    shapes: [
      {
        tag: 'path',
        d: 'M70 83l-2.5-10h25L90 83z',
        fill: '#EBD3DA',
        stroke: '#C99AA8',
        strokeWidth: 1.6,
        strokeLinejoin: 'round',
      },
      { tag: 'path', d: 'M74 74l1 8M80 74v8M86 74l-1 8', stroke: '#C99AA8', strokeWidth: 1.2, strokeLinecap: 'round' },
      { tag: 'path', d: 'M66 74c0-8 6-11 14-11s14 3 14 11z', ...BAKED },
      { tag: 'circle', cx: 74, cy: 69, r: 1.4, fill: '#6F78B8' },
      { tag: 'circle', cx: 82, cy: 67, r: 1.4, fill: '#6F78B8' },
      { tag: 'circle', cx: 87, cy: 71, r: 1.4, fill: '#6F78B8' },
    ],
  },
  {
    name: 'a baguette',
    shadow: 25,
    shapes: [
      { tag: 'path', d: 'M56 83c0-5 8-8 24-8s24 3 24 8z', ...BAKED },
      { tag: 'path', d: 'M64 80l5-3M75 79.5l5-3M86 79.5l5-3', ...LINE },
    ],
  },
  {
    name: 'a doughnut',
    shadow: 14,
    shapes: [
      { tag: 'ellipse', cx: 80, cy: 76.5, rx: 13.5, ry: 6.6, ...BAKED },
      {
        tag: 'path',
        d: 'M67.6 75.2c0-3.6 5.5-6.2 12.4-6.2s12.4 2.6 12.4 6.2c0 1.4-1.4 1.6-2.2 1-.8 1.6-2.6 2-3.4.8-1 1.8-3 1.8-3.8.4-1.2 1.6-3.6 1.6-4.6.2-1 1.4-3 1.2-3.6-.2-1 1.2-2.8 1-3.2-.6-1 .6-2 0-2-1.6z',
        fill: '#EAA3B4',
        topping: true,
      },
      { tag: 'ellipse', cx: 80, cy: 74.6, rx: 3.6, ry: 1.7, fill: '#A87A35' },
      {
        tag: 'path',
        d: 'M71.5 73.6l1.5-.4M75 71.2l1.2-.8M84.8 71.2l1.3.6M88 74l1.2.6M83.6 76.2l1.4.1M76 76.4l1.1-.6',
        topping: true,
        stroke: 'white',
        strokeWidth: 1.1,
        strokeLinecap: 'round',
      },
    ],
  },
];
