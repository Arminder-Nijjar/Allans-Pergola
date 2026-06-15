// Pergola Builder — Catalog & Rules
// Allan's Landscaping & Disposal - Premium 3D Pergola Configurator

export const BRAND = {
  name: "Allan's Landscaping & Disposal",
  shortName: "Allan's",
  tagline: 'Premium Pergola Builder',
  logoUrl: null, // Add your logo to public/logo.png and set to '/logo.png'
  primaryColor: '#1a7a4b',
  primaryDark: '#0d5c36',
};

export const POST_COLORS = [
  { id: 'jet-black', name: 'Jet Black (RAL 9005)', hex: '#0a0e11' },
  { id: 'umbra-grey', name: 'Umbra Grey (RAL 7002)', hex: '#78746c' },
  { id: 'pure-white', name: 'Pure White (RAL 9010)', hex: '#f8f6f0' },
];

export const LOUVER_COLORS = POST_COLORS;

export const SCREEN_COLORS = [
  { id: 'white', name: 'White', hex: '#f3f0e8' },
  { id: 'beige', name: 'Beige', hex: '#d6c8a8' },
  { id: 'grey', name: 'Grey', hex: '#9a9a9a' },
  { id: 'bronze', name: 'Bronze', hex: '#5e4a30' },
  { id: 'black', name: 'Black', hex: '#1a1a1a' },
];

export const WALL_COLORS = [
  { id: 'white', name: 'White', hex: '#ece9e1' },
  { id: 'grey', name: 'Grey', hex: '#6f6f6e' },
  { id: 'black', name: 'Black', hex: '#1a1a1a' },
  { id: 'wooden', name: 'Wooden', hex: '#8a6a48' },
];

export const LIGHT_COLORS = [
  { id: 'none', name: 'None', hex: '#cccccc' },
  { id: 'warm', name: 'Warm White', hex: '#ffd28a' },
  { id: 'rgb', name: 'RGB', hex: 'conic-gradient(from 0deg, #ff4d4d, #ffd84d, #4dff7a, #4dd0ff, #b14dff, #ff4d4d)' },
];

export const STYLES = [
  { id: 'freestanding', label: 'Freestanding', desc: 'Independent structure with 4 corner posts. Place anywhere.' },
  { id: 'attached', label: 'Attached', desc: 'Secured to an existing wall via a horizontal beam. 2–4 posts.' },
  { id: '10x12-kit', label: '10×12 Kit', desc: 'Standard 10×12 ft kit with 9 ft height. Premium pre-configured option.' },
];

export const GROUND_TYPES = [
  { id: 'gravel', label: 'Gravel', desc: 'Loose stone base — ideal for drainage and permeability.' },
  { id: 'grass', label: 'Grass / Lawn', desc: 'Natural turf — may require prep work before installation.' },
  { id: 'concrete', label: 'Concrete Slab', desc: 'Solid poured concrete — best for anchoring and stability.' },
  { id: 'paving', label: 'Paving Stones', desc: 'Interlocking pavers — level surface with good drainage.' },
];

export const LAYOUTS = [
  { id: 'horizontal', label: 'Horizontal', desc: 'Single rectangular pergola section. Classic design.' },
  { id: 'l-shape', label: 'L-Shape', desc: 'Two connected sections at 90° angle. Expands your coverage.' },
];

// Possible attachment configurations for L-shape (4 orientations)
// Section 2 can attach to any corner of Section 1
export const L_SHAPE_CONFIGS = [
  { id: 'left-back', label: '└ Left-Back', desc: 'Section 2 extends LEFT from BACK of Section 1 (└ shape)' },
  { id: 'right-back', label: '┌ Right-Back', desc: 'Section 2 extends RIGHT from BACK of Section 1 (┌ shape)' },
  { id: 'left-front', label: '┐ Left-Front', desc: 'Section 2 extends LEFT from FRONT of Section 1 (┐ shape)' },
  { id: 'right-front', label: '┘ Right-Front', desc: 'Section 2 extends RIGHT from FRONT of Section 1 (┘ shape)' },
];

export const SIDES = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

export const LIMITS = {
  length: { min: 8, max: 30, step: 1, default: 12 },
  width: { min: 8, max: 30, step: 1, default: 10 },
  height: { min: 8, max: 14, step: 1, default: 9 },
  postIncrement: 0.5,
  minPostSpacing: 4,
  minCornerOffset: 4,
  extraSupportThreshold: 15,
  louver: { minSpan: 7, maxSpan: 15, single: 15 },
  screen: { minW: 4, maxW: 18.16, minH: 4, maxH: 14 },
  wallGap: { min: 0.5, max: 6, step: 0.5 },
};

// Default: Horizontal layout, 12 ft × 10 ft, height 9 ft
export const DEFAULT_CONFIG = {
  layout: 'horizontal',
  lShapeConfig: 'right-back',
  sections: [
    { id: 'section-1', length: 12, width: 10, height: 9 },
  ],
  activeSection: 'section-1',
  style: 'freestanding',
  attachedSide: 'back',
  postColor: 'umbra-grey',
  louverColor: 'pure-white',
  louverRotation: 100,
  lightColor: 'warm',
  screenColor: 'beige',
  screens: [],
  wallColor: 'white',
  wallGap: 0,
  walls: [],
  showDimensions: false,
  editMode: 'none',
  extraPostPositions: {},
  optionalExtraPosts: {}, // sectionId -> { side: count } for accessory posts
  removedPostKeys: [], // array of post keys user has removed from view
  design: 'hidden-screws',
  postSize: '6x6',
  louverOperation: 'manual',
  louverControlType: 'remote', // 'remote' or 'app' (only applies when motorized)
  kitLouverOperation: 'motorized',
  kitLouverControlType: 'remote', // 'remote' or 'app' for kits
  screenOperation: 'manual',
  kitLightSides: 'front-back',
  addOns: {},
  groundType: 'gravel',
  heaters: [], // { sectionId, side }[] for wall-mounted heater placement
  outlets: [], // { sectionId, postKey }[] for outlet placement on posts
  notes: '', // user notes for design team
};
