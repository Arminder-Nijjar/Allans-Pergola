import { DEFAULT_CONFIG, STYLES, LAYOUTS, LIMITS, SIDES } from '../data/catalog';

describe('catalog', () => {
  test('DEFAULT_CONFIG starts with a single valid section', () => {
    expect(DEFAULT_CONFIG.sections).toHaveLength(1);
    const s = DEFAULT_CONFIG.sections[0];
    expect(s.id).toBe('section-1');
    expect(s.length).toBeGreaterThanOrEqual(LIMITS.length.min);
    expect(s.length).toBeLessThanOrEqual(LIMITS.length.max);
    expect(s.width).toBeGreaterThanOrEqual(LIMITS.width.min);
    expect(s.width).toBeLessThanOrEqual(LIMITS.width.max);
    expect(s.height).toBeGreaterThanOrEqual(LIMITS.height.min);
    expect(s.height).toBeLessThanOrEqual(LIMITS.height.max);
  });

  test('DEFAULT_CONFIG has empty add-ons, walls and screens', () => {
    expect(DEFAULT_CONFIG.addOns).toEqual({});
    expect(DEFAULT_CONFIG.walls).toEqual([]);
    expect(DEFAULT_CONFIG.screens).toEqual([]);
  });

  test('styles include freestanding, attached and the 10x12 kit', () => {
    expect(STYLES.map((s) => s.id)).toEqual(['freestanding', 'attached', '10x12-kit']);
  });

  test('layouts no longer include the kit (it moved to styles)', () => {
    expect(LAYOUTS.map((l) => l.id)).toEqual(['horizontal', 'l-shape']);
  });

  test('kit louver defaults are valid', () => {
    expect(['manual', 'motorized', 'phone-controlled']).toContain(DEFAULT_CONFIG.kitLouverOperation);
    expect(['front-back', 'left-right', 'all', 'none']).toContain(DEFAULT_CONFIG.kitLightSides);
  });

  test('four sides defined', () => {
    expect(SIDES.map((s) => s.id)).toEqual(['front', 'back', 'left', 'right']);
  });
});
