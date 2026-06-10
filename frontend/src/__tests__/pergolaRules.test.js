import {
  isAttachedSide,
  louverSetCount,
  louverOperation,
  screenOperation,
  postPlan,
  canPlaceOnSide,
  hasOpenSegment,
  oppositeSide,
} from '../utils/pergolaRules';
import { DEFAULT_CONFIG } from '../data/catalog';

const baseCfg = (over = {}) => ({
  ...DEFAULT_CONFIG,
  sections: [{ id: 'section-1', length: 12, width: 10, height: 9 }],
  walls: [],
  screens: [],
  ...over,
});

describe('isAttachedSide', () => {
  test('false for freestanding', () => {
    expect(isAttachedSide(baseCfg(), 'section-1', 'back')).toBe(false);
  });

  test('true on the attached side for the single section', () => {
    const cfg = baseCfg({ style: 'attached', attachedSide: 'back' });
    expect(isAttachedSide(cfg, 'section-1', 'back')).toBe(true);
    expect(isAttachedSide(cfg, 'section-1', 'front')).toBe(false);
  });

  test('false for the kit (style is not attached)', () => {
    const cfg = baseCfg({ style: '10x12-kit', layout: '10x12-kit' });
    expect(isAttachedSide(cfg, 'section-1', 'back')).toBe(false);
  });
});

describe('louverSetCount', () => {
  test.each([
    [10, 12, 1],
    [12, 16, 1],
    [12, 27, 2],
    [16, 25, 2],
    [20, 30, 2],
  ])('%i x %i -> %i set(s)', (l, w, expected) => {
    expect(louverSetCount({ length: l, width: w, height: 9 })).toBe(expected);
  });
});

describe('louverOperation', () => {
  test('manual when within 12x16', () => {
    const cfg = baseCfg();
    expect(louverOperation({ length: 12, width: 16, height: 9 }, cfg)).toBe('manual');
    expect(louverOperation({ length: 16, width: 12, height: 9 }, cfg)).toBe('manual');
  });

  test('motorized when bigger than 12x16', () => {
    const cfg = baseCfg();
    expect(louverOperation({ length: 13, width: 13, height: 9 }, cfg)).toBe('motorized');
    expect(louverOperation({ length: 12, width: 17, height: 9 }, cfg)).toBe('motorized');
  });

  test('kit follows kitLouverOperation', () => {
    const section = { length: 12, width: 10, height: 9 };
    expect(louverOperation(section, baseCfg({ layout: '10x12-kit', kitLouverOperation: 'manual' }))).toBe('manual');
    expect(louverOperation(section, baseCfg({ layout: '10x12-kit', kitLouverOperation: 'phone-controlled' }))).toBe('phone-controlled');
    expect(louverOperation(section, baseCfg({ layout: '10x12-kit', kitLouverOperation: undefined }))).toBe('motorized');
  });
});

describe('screenOperation', () => {
  test('manual up to 10x12', () => {
    expect(screenOperation({ length: 10, width: 12, height: 9 })).toBe('manual');
  });
  test('motorized beyond 10x12', () => {
    expect(screenOperation({ length: 12, width: 12, height: 9 })).toBe('motorized');
    expect(screenOperation({ length: 10, width: 13, height: 9 })).toBe('motorized');
  });
});

describe('postPlan', () => {
  test('freestanding 12x10 -> 4 corner posts, no extras', () => {
    const plan = postPlan(baseCfg(), 'section-1');
    expect(plan.cornerPosts).toBe(4);
    expect(plan.extras).toBe(0);
    expect(plan.total).toBe(4);
  });

  test('freestanding 20x10 -> mandatory extra posts on long sides', () => {
    const cfg = baseCfg({ sections: [{ id: 'section-1', length: 20, width: 10, height: 9 }] });
    const plan = postPlan(cfg, 'section-1');
    expect(plan.cornerPosts).toBe(4);
    expect(plan.extraSides.sort()).toEqual(['back', 'front']);
    expect(plan.extras).toBe(2);
    expect(plan.total).toBe(6);
  });

  test('attached 12x10 -> 2 corner posts, attached side skipped', () => {
    const cfg = baseCfg({ style: 'attached', attachedSide: 'back' });
    const plan = postPlan(cfg, 'section-1');
    expect(plan.cornerPosts).toBe(2);
    expect(plan.extras).toBe(0);
  });

  test('attached 20x10 on back -> no extra post on the attached side', () => {
    const cfg = baseCfg({
      style: 'attached',
      attachedSide: 'back',
      sections: [{ id: 'section-1', length: 20, width: 10, height: 9 }],
    });
    const plan = postPlan(cfg, 'section-1');
    expect(plan.extraSides).toEqual(['front']);
    // free side (front) is 20 ft >= 15 -> corner posts bump to 4
    expect(plan.cornerPosts).toBe(4);
  });

  test('optional accessory posts are counted', () => {
    const cfg = baseCfg({ optionalExtraPosts: { 'section-1': { front: 2 } } });
    const plan = postPlan(cfg, 'section-1');
    expect(plan.extras).toBe(2);
    expect(plan.extraSideCounts.front).toBe(2);
  });
});

describe('canPlaceOnSide / hasOpenSegment', () => {
  test('cannot place wall or screen on the attached side', () => {
    const cfg = baseCfg({ style: 'attached', attachedSide: 'back' });
    expect(canPlaceOnSide(cfg, 'wall', 'section-1', 'back')).toBe(false);
    expect(canPlaceOnSide(cfg, 'screen', 'section-1', 'back')).toBe(false);
  });

  test('can place wall on a free side', () => {
    const cfg = baseCfg();
    expect(canPlaceOnSide(cfg, 'wall', 'section-1', 'front')).toBe(true);
  });

  test('hasOpenSegment true for default config', () => {
    expect(hasOpenSegment(baseCfg())).toBe(true);
  });
});

describe('oppositeSide', () => {
  test.each([
    ['front', 'back'],
    ['back', 'front'],
    ['left', 'right'],
    ['right', 'left'],
  ])('%s -> %s', (a, b) => {
    expect(oppositeSide(a)).toBe(b);
  });
});
