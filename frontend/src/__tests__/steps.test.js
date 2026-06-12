import { ALL_STEPS, getSteps } from '../utils/steps';

describe('step flow', () => {
  test('ALL_STEPS has the expected order', () => {
    expect(ALL_STEPS.map((s) => s.id)).toEqual([
      'style', 'layout', 'dimensions', 'frame', 'walls',
      'screens', 'lights', 'add-ons', 'review', 'quote',
    ]);
  });

  test('add-ons step comes directly before review', () => {
    const ids = ALL_STEPS.map((s) => s.id);
    expect(ids.indexOf('add-ons')).toBe(ids.indexOf('review') - 1);
  });

  test('default config keeps every step', () => {
    const steps = getSteps({ layout: 'horizontal' });
    expect(steps).toHaveLength(ALL_STEPS.length);
  });

  test('l-shape keeps every step', () => {
    const steps = getSteps({ layout: 'l-shape' });
    expect(steps).toHaveLength(ALL_STEPS.length);
  });

  test('10x12 kit skips layout and frame', () => {
    const ids = getSteps({ layout: '10x12-kit' }).map((s) => s.id);
    expect(ids).toEqual(['style', 'dimensions', 'walls', 'screens', 'lights', 'add-ons', 'review', 'quote']);
  });

  test('kit flow still ends with add-ons -> review -> quote', () => {
    const ids = getSteps({ layout: '10x12-kit' }).map((s) => s.id);
    expect(ids.slice(-3)).toEqual(['add-ons', 'review', 'quote']);
  });

  test('handles missing config gracefully', () => {
    expect(getSteps(undefined)).toHaveLength(ALL_STEPS.length);
    expect(getSteps(null)).toHaveLength(ALL_STEPS.length);
  });
});
