// Step flow definition and per-config filtering for the pergola builder.

export const ALL_STEPS = [
  { id: 'style', label: 'Style' },
  { id: 'layout', label: 'Layout' },
  { id: 'dimensions', label: 'Size' },
  { id: 'frame', label: 'Colour' },
  { id: 'walls', label: 'Walls' },
  { id: 'screens', label: 'Screens' },
  { id: 'lights', label: 'Lights' },
  { id: 'add-ons', label: 'Add-ons' },
  { id: 'review', label: 'Review' },
  { id: 'quote', label: 'Submit' },
];

// 10x12 kit skips: layout (fixed), frame (fixed colours)
const KIT_SKIPPED_STEPS = ['layout', 'frame'];

export function getSteps(cfg) {
  if (cfg?.layout === '10x12-kit') {
    return ALL_STEPS.filter((s) => !KIT_SKIPPED_STEPS.includes(s.id));
  }
  return ALL_STEPS;
}
