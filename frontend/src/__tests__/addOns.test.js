import { HEATER_TYPES, HEATER_MODELS } from '../components/steps/AddOnsStep';

describe('heater catalog data', () => {
  test('three heater styles exist', () => {
    expect(HEATER_TYPES.map((t) => t.id)).toEqual(['wall-mounted', 'hanging', 'freestanding']);
  });

  test('every model has the required fields', () => {
    for (const m of HEATER_MODELS) {
      expect(typeof m.id).toBe('string');
      expect(m.label).toBeTruthy();
      expect(['Electric', 'Gas']).toContain(m.fuel);
      expect(m.spec).toBeTruthy();
      expect(m.img).toMatch(/^https:\/\//);
      expect(Array.isArray(m.types)).toBe(true);
      expect(m.types.length).toBeGreaterThan(0);
    }
  });

  test('model ids are unique', () => {
    const ids = HEATER_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every model type maps to a valid heater style', () => {
    const styleIds = HEATER_TYPES.map((t) => t.id);
    for (const m of HEATER_MODELS) {
      for (const t of m.types) {
        expect(styleIds).toContain(t);
      }
    }
  });

  test('wall-mounted offers 4 models (Tungsten E, Platinum E, Tungsten Gas, Cobalt E)', () => {
    const wall = HEATER_MODELS.filter((m) => m.types.includes('wall-mounted'));
    expect(wall.map((m) => m.id).sort()).toEqual(
      ['cobalt-electric', 'platinum-electric', 'tungsten-electric', 'tungsten-gas-43k'].sort()
    );
  });

  test('hanging offers only the Eclipse ceiling model', () => {
    const hanging = HEATER_MODELS.filter((m) => m.types.includes('hanging'));
    expect(hanging.map((m) => m.id)).toEqual(['eclipse-electric-220']);
  });

  test('freestanding offers the two portable models', () => {
    const free = HEATER_MODELS.filter((m) => m.types.includes('freestanding'));
    expect(free.map((m) => m.id).sort()).toEqual(
      ['eclipse-electric-portable', 'tungsten-gas-portable'].sort()
    );
  });

  test('only Tungsten Electric and Platinum Electric ask for a colour', () => {
    const colorModels = HEATER_MODELS.filter((m) => m.needsColor).map((m) => m.id);
    expect(colorModels.sort()).toEqual(['platinum-electric', 'tungsten-electric'].sort());
  });

  test('gas models carry BTU specs, electric models carry wattage', () => {
    for (const m of HEATER_MODELS) {
      if (m.fuel === 'Gas') expect(m.spec).toMatch(/BTU/);
      else expect(m.spec).toMatch(/W/);
    }
  });
});
