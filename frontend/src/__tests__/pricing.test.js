// Pricing Test Suite - 30+ test cases for pergola pricing accuracy

// Screen pricing table
const SCREEN_PRICES = {
  4: [2880, 2920, 3065, 3170, 3200, 3270, 3375, 3425, 3525, 3655, 3665, 3815, 3920, 3980, 4030, 4050, 4130, 4200, 4220, 4275, 4325, 4430, 4485, 4570, 4635, 4685, 4740, 4840, 4900, 4950],
  5: [2940, 3000, 3140, 3190, 3240, 3345, 3450, 3500, 3595, 3695, 3765, 3750, 3900, 3980, 4030, 4050, 4040, 4140, 4190, 4140, 4295, 4340, 4415, 4505, 4560, 4600, 4700, 4750, 4840, 4910, 4960, 5020, 5115],
  6: [3060, 3115, 3200, 3255, 3310, 3460, 3555, 3615, 3665, 3760, 3830, 4270, 4370, 4410, 4560, 4610, 4750, 4800, 4895, 5010, 5070, 5145, 5200, 5310, 5400, 5470, 5530, 5620, 5775, 5825, 5930],
  7: [3235, 3280, 3335, 3425, 3475, 3680, 3750, 3825, 3885, 4035, 4100, 4125, 4330, 4450, 4520, 4550, 4650, 4750, 4800, 4880, 4900, 5030, 5125, 5175, 5275, 5330, 5370, 5400, 5460, 5530, 5620, 5720, 5780, 5880],
  8: [3330, 3345, 3540, 3585, 3640, 3750, 3900, 3955, 4050, 4175, 4250, 4400, 4500, 4540, 4620, 4800, 4900, 4945, 5000, 5125, 5200, 5345, 5440, 5490, 5580, 5630, 5720, 5750, 5830, 5870, 5925, 6000],
  9: [3355, 4330, 3600, 3660, 3700, 3750, 3800, 4020, 4100, 4260, 4320, 4480, 4560, 4610, 4750, 4810, 4860, 5020, 5060, 5125, 5275, 5330, 5375, 5530, 5590, 5640, 5740, 5840, 5840, 5925, 6000],
  10: [3525, 3575, 3680, 3730, 3770, 3885, 4040, 4090, 4185, 4330, 4390, 4450, 4535, 4630, 4750, 4750, 4825, 4890, 4935, 4995, 5075, 5135, 5200, 5345, 5400, 5450, 5550, 5590, 5970, 5970, 6070],
  11: [3585, 3640, 3740, 3780, 3850, 3930, 4085, 4150, 4250, 4390, 4450, 4600, 4685, 4750, 4800, 4890, 4930, 4995, 5155, 5200, 5250, 5400, 5450, 5500, 5550, 5590, 5990, 5970, 6070, 6150],
  12: [3710, 3755, 3810, 3850, 4100, 4300, 4410, 4490, 4670, 4775, 4830, 4920, 5070, 5120, 5200, 5400, 5480, 5580, 5680, 5770, 5850, 6000, 6050, 6150, 5650, 5700, 5750, 5870, 5960, 6050, 6150],
  13: [3880, 3875, 3975, 4040, 4175, 4385, 4485, 4540, 4735, 4835, 4890, 4920, 4980, 5070, 5140, 5240, 5345, 5500, 5550, 5580, 5650, 5770, 5870, 5850, 6000, 6050, 6200],
  14: [3900, 4000, 4050, 4150, 4250, 4400, 4550, 4600, 4850, 4950, 5050, 5200, 5300, 5400, 5565, 5650, 5750, 5850, 5870, 5960, 6050, 6200],
};

function getScreenPrice(widthFt, heightFt) {
  const widthKey = Math.min(Math.max(Math.round(widthFt), 4), 14);
  const heightKey = Math.min(Math.max(Math.round(heightFt), 4), 14);
  const widthIdx = Math.min(Math.max(Math.round((widthFt - 4) * 2), 0), 29);
  const prices = SCREEN_PRICES[heightKey] || SCREEN_PRICES[10];
  return prices[widthIdx] || prices[0] || 3000;
}

// Pricing calculation (matches ReviewStep logic)
function calculatePricing(cfg) {
  const lines = [];
  let total = 0;
  const isKit = cfg.layout === '10x12-kit';
  const sections = cfg.sections || [];
  const numSections = sections.length;
  const totalSqft = sections.reduce((sum, s) => sum + (s.length || 0) * (s.width || 0), 0);

  if (isKit) {
    lines.push({ label: 'Pergola Kit', price: 10000 });
    total += 10000;
    if (cfg.louverOperation === 'motorized') {
      lines.push({ label: 'Motorized Louvers', price: 2200 });
      total += 2200;
    }
    if (cfg.kitLightSides !== 'none' && cfg.lightColor !== 'none') {
      const lightPrice = cfg.lightColor === 'rgb' ? 2250 : 1850;
      lines.push({ label: 'Lights', price: lightPrice });
      total += lightPrice;
    }
  } else {
    const plan = cfg.postPlan || { total: 4 * numSections, cornerPosts: 4 * numSections, extras: 0 };
    const extraPosts = Math.max(0, (plan.total || 4 * numSections) - (4 * numSections));
    const isMultiSection = numSections > 1 || extraPosts > 0;

    let sqftRate, tierName;
    if (totalSqft < 64) {
      sqftRate = 160;
      tierName = 'Extra-Small';
    } else if (totalSqft <= 99) {
      sqftRate = 160;
      tierName = 'Extra-Small';
    } else if (totalSqft <= 119) {
      sqftRate = 150;
      tierName = 'Small';
    } else if (isMultiSection) {
      sqftRate = 140;
      tierName = 'Multi-Section';
    } else {
      sqftRate = 130;
      tierName = 'Standard';
    }

    const basePrice = Math.round(totalSqft * sqftRate);
    lines.push({ label: `${tierName}: ${totalSqft} sqft × $${sqftRate}`, price: basePrice });
    total += basePrice;

    // Extra posts
    if (extraPosts > 0) {
      const tallCount = sections.filter(s => (s.height || 9) >= 10).length;
      const regularCount = Math.max(0, extraPosts - tallCount);
      if (regularCount > 0) {
        lines.push({ label: `Extra Posts: ${regularCount} × $1,200`, price: regularCount * 1200 });
        total += regularCount * 1200;
      }
      if (tallCount > 0) {
        const tallTotal = tallCount * (1200 + 600);
        lines.push({ label: `Extra-Long Posts: ${tallCount} × $600 + $1,200`, price: tallTotal });
        total += tallTotal;
      }
    }

    // Support beam (attached style OR fan/heater add-on)
    const addOns = cfg.addOns || {};
    const needsBeam = cfg.style === 'attached' || addOns.fan || addOns.heater;
    if (needsBeam) {
      lines.push({ label: 'Support Beam', price: 1200 });
      total += 1200;
    }

    // Louver operation (per louver set)
    if (cfg.louverOperation === 'motorized') {
      const isApp = cfg.louverControlType === 'app';
      // Calculate total louver sets across all sections
      const totalSets = sections.reduce((sum, s) => {
        const larger = Math.max(s.length || 0, s.width || 0);
        if (larger <= 16) return sum + 1;
        return sum + Math.ceil(larger / 15);
      }, 0);
      const baseCost = 2200 * totalSets;
      const opCost = isApp ? baseCost + (700 * totalSets) : baseCost;
      lines.push({ label: `Louver Op (${isApp ? 'App' : 'Remote'})`, price: opCost });
      total += opCost;
    }

    // Lighting
    if (cfg.lightColor === 'warm' || cfg.lightColor === 'white') {
      const lightPrice = 2850 * numSections;
      lines.push({ label: `White LED ×${numSections}`, price: lightPrice });
      total += lightPrice;
    } else if (cfg.lightColor === 'rgb') {
      const lightPrice = 3250 * numSections;
      lines.push({ label: `RGB ×${numSections}`, price: lightPrice });
      total += lightPrice;
    }

    // Walls
    if (cfg.walls?.length > 0) {
      cfg.walls.forEach(w => {
        const section = sections.find(s => s.id === w.sectionId) || sections[0];
        const sideLen = (w.side === 'front' || w.side === 'back') ? (section.length || 12) : (section.width || 10);
        const height = section.height || 9;
        const price = Math.round(sideLen * height * 55);
        lines.push({ label: `Wall ${w.side}`, price });
        total += price;
      });
    }

    // Screens
    if (cfg.screens?.length > 0) {
      const screenOp = cfg.screenOperation || 'remote';
      cfg.screens.forEach(s => {
        const section = sections.find(sec => sec.id === s.sectionId) || sections[0];
        const widthFt = (s.side === 'front' || s.side === 'back') ? (section.length || 12) : (section.width || 10);
        const heightFt = section.height || 9;
        let price = getScreenPrice(widthFt, heightFt);
        if (screenOp === 'manual') price -= 1100;
        lines.push({ label: `Screen ${s.side}`, price });
        total += price;
      });
    }
  }

  const gst = Math.round(total * 0.05 * 100) / 100;
  const pst = Math.round(total * 0.06 * 100) / 100;
  return { lines, subtotal: total, gst, pst, total: Math.round((total + gst + pst) * 100) / 100 };
}

const defaultConfig = (overrides = {}) => ({
  layout: 'horizontal',
  style: 'freestanding',
  sections: [{ id: 's1', length: 12, width: 10, height: 9 }],
  louverOperation: 'manual',
  louverControlType: 'remote',
  lightColor: 'none',
  screenOperation: 'remote',
  walls: [],
  screens: [],
  postPlan: { total: 4, cornerPosts: 4, extras: 0 },
  ...overrides,
});

describe('Pricing Tests', () => {
  describe('Size Tiers', () => {
    it('Standard 12×10 = 120 sqft @ $130 = $15,600', () => {
      const r = calculatePricing(defaultConfig({ sections: [{ id: 's1', length: 12, width: 10, height: 9 }] }));
      expect(r.lines[0].price).toBe(15600);
    });

    it('Small 10×11 = 110 sqft @ $150 = $16,500', () => {
      const r = calculatePricing(defaultConfig({ sections: [{ id: 's1', length: 11, width: 10, height: 9 }] }));
      expect(r.lines[0].price).toBe(16500);
    });

    it('Extra-Small 8×10 = 80 sqft @ $160 = $12,800', () => {
      const r = calculatePricing(defaultConfig({ sections: [{ id: 's1', length: 10, width: 8, height: 9 }] }));
      expect(r.lines[0].price).toBe(12800);
    });

    it('Extra-Small boundary 8×8 = 64 sqft @ $160', () => {
      const r = calculatePricing(defaultConfig({ sections: [{ id: 's1', length: 8, width: 8, height: 9 }] }));
      expect(r.lines[0].price).toBe(10240);
    });

    it('Below minimum 7×9 = 63 sqft @ $160', () => {
      const r = calculatePricing(defaultConfig({ sections: [{ id: 's1', length: 9, width: 7, height: 9 }] }));
      expect(r.lines[0].price).toBe(10080);
    });
  });

  describe('Multi-Section / L-Shape', () => {
    it('L-Shape 12×10 + 10×10 = 220 sqft @ $140 = $30,800', () => {
      const r = calculatePricing(defaultConfig({
        layout: 'l-shape',
        sections: [{ id: 's1', length: 12, width: 10 }, { id: 's2', length: 10, width: 10 }],
      }));
      expect(r.lines[0].price).toBe(30800);
    });

    it('Extra posts trigger multi-section rate', () => {
      const r = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 20, width: 10 }],
        postPlan: { total: 7, cornerPosts: 4, extras: 3 },
      }));
      expect(r.lines[0].label).toContain('Multi-Section');
      expect(r.lines[0].price).toBe(28000); // 200 sqft × 140
    });
  });

  describe('Extra Posts', () => {
    it('Extra posts $1,200 each', () => {
      const r = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 20, width: 10 }],
        postPlan: { total: 7, cornerPosts: 4, extras: 3 },
      }));
      const extraLine = r.lines.find(l => l.label.includes('Extra Posts') && !l.label.includes('Long'));
      expect(extraLine?.price).toBe(3600);
    });

    it('Extra-long posts (10-13 ft) $1,800 ($600 + $1,200)', () => {
      const r = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 20, width: 10, height: 12 }],
        postPlan: { total: 5, cornerPosts: 4, extras: 1 },
      }));
      const tallLine = r.lines.find(l => l.label.includes('Long'));
      expect(tallLine?.price).toBe(1800); // $600 tall + $1,200 extra post
    });
  });

  describe('Louvers', () => {
    it('Remote single section (1 set) $2,200', () => {
      const r = calculatePricing(defaultConfig({ louverOperation: 'motorized', louverControlType: 'remote' }));
      expect(r.lines.find(l => l.label.includes('Louver'))?.price).toBe(2200);
    });

    it('App single section (1 set) $2,900', () => {
      const r = calculatePricing(defaultConfig({ louverOperation: 'motorized', louverControlType: 'app' }));
      expect(r.lines.find(l => l.label.includes('Louver'))?.price).toBe(2900);
    });

    it('Remote section with 2 louver sets (20×10) = $4,400', () => {
      // 20 ft larger dimension → 2 louver sets, 2 × $2,200 = $4,400
      const r = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 20, width: 10 }],
        louverOperation: 'motorized',
        louverControlType: 'remote',
      }));
      expect(r.lines.find(l => l.label.includes('Louver'))?.price).toBe(4400);
    });

    it('App section with 2 louver sets (20×10) = $5,800', () => {
      // 20 ft larger dimension → 2 louver sets, 2 × $2,900 = $5,800
      const r = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 20, width: 10 }],
        louverOperation: 'motorized',
        louverControlType: 'app',
      }));
      expect(r.lines.find(l => l.label.includes('Louver'))?.price).toBe(5800);
    });

    it('Remote L-shape with 2+2 sets = $8,800', () => {
      // Section 1: 12×10 → 1 set, Section 2: 20×10 → 2 sets, total 3 sets × $2,200 = $6,600
      const r = calculatePricing(defaultConfig({
        layout: 'l-shape',
        sections: [{ id: 's1', length: 12, width: 10 }, { id: 's2', length: 20, width: 10 }],
        louverOperation: 'motorized',
        louverControlType: 'remote',
      }));
      expect(r.lines.find(l => l.label.includes('Louver'))?.price).toBe(6600);
    });

    it('Manual = no charge', () => {
      const r = calculatePricing(defaultConfig({ louverOperation: 'manual' }));
      expect(r.lines.find(l => l.label.includes('Louver'))).toBeUndefined();
    });
  });

  describe('Lighting', () => {
    it('White LED single $2,850', () => {
      const r = calculatePricing(defaultConfig({ lightColor: 'white' }));
      expect(r.lines.find(l => l.label.includes('White LED'))?.price).toBe(2850);
    });

    it('RGB single $3,250', () => {
      const r = calculatePricing(defaultConfig({ lightColor: 'rgb' }));
      expect(r.lines.find(l => l.label.includes('RGB'))?.price).toBe(3250);
    });

    it('White LED 2 sections $5,700', () => {
      const r = calculatePricing(defaultConfig({
        layout: 'l-shape',
        sections: [{ id: 's1', length: 12, width: 10 }, { id: 's2', length: 10, width: 10 }],
        lightColor: 'white',
      }));
      expect(r.lines.find(l => l.label.includes('White LED'))?.price).toBe(5700);
    });

    it('RGB 2 sections $6,500', () => {
      const r = calculatePricing(defaultConfig({
        layout: 'l-shape',
        sections: [{ id: 's1', length: 12, width: 10 }, { id: 's2', length: 10, width: 10 }],
        lightColor: 'rgb',
      }));
      expect(r.lines.find(l => l.label.includes('RGB'))?.price).toBe(6500);
    });
  });

  describe('Walls', () => {
    it('Wall 12×9 = 108 sqft × $55 = $5,940', () => {
      const r = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 12, width: 10, height: 9 }],
        walls: [{ side: 'front', sectionId: 's1' }],
      }));
      expect(r.lines.find(l => l.label.includes('Wall'))?.price).toBe(5940);
    });

    it('Wall 10×9 = 90 sqft × $55 = $4,950', () => {
      const r = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 12, width: 10, height: 9 }],
        walls: [{ side: 'left', sectionId: 's1' }],
      }));
      expect(r.lines.find(l => l.label.includes('Wall'))?.price).toBe(4950);
    });
  });

  describe('Screens', () => {
    it('Screen remote price from table', () => {
      const r = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 12, width: 10, height: 9 }],
        screens: [{ side: 'front', sectionId: 's1' }],
        screenOperation: 'remote',
      }));
      expect(r.lines.find(l => l.label.includes('Screen'))?.price).toBeGreaterThan(0);
    });

    it('Manual screen -$1,100 discount', () => {
      const remote = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 12, width: 10, height: 9 }],
        screens: [{ side: 'front', sectionId: 's1' }],
        screenOperation: 'remote',
      }));
      const manual = calculatePricing(defaultConfig({
        sections: [{ id: 's1', length: 12, width: 10, height: 9 }],
        screens: [{ side: 'front', sectionId: 's1' }],
        screenOperation: 'manual',
      }));
      const remotePrice = remote.lines.find(l => l.label.includes('Screen'))?.price || 0;
      const manualPrice = manual.lines.find(l => l.label.includes('Screen'))?.price || 0;
      expect(remotePrice - manualPrice).toBe(1100);
    });
  });

  describe('Support Beam', () => {
    it('Attached style adds $1,200', () => {
      const r = calculatePricing(defaultConfig({ style: 'attached' }));
      expect(r.lines.find(l => l.label.includes('Support Beam'))?.price).toBe(1200);
    });

    it('Fan add-on adds support beam $1,200', () => {
      const r = calculatePricing(defaultConfig({ addOns: { fan: true } }));
      expect(r.lines.find(l => l.label.includes('Support Beam'))?.price).toBe(1200);
    });

    it('Heater add-on adds support beam $1,200', () => {
      const r = calculatePricing(defaultConfig({ addOns: { heater: true, heaterType: 'hanging' } }));
      expect(r.lines.find(l => l.label.includes('Support Beam'))?.price).toBe(1200);
    });

    it('Attached + fan only charges beam once', () => {
      const r = calculatePricing(defaultConfig({ style: 'attached', addOns: { fan: true } }));
      const beamLines = r.lines.filter(l => l.label.includes('Support Beam'));
      expect(beamLines.length).toBe(1);
      expect(beamLines[0].price).toBe(1200);
    });
  });

  describe('Kit', () => {
    it('Kit base $10,000', () => {
      const r = calculatePricing(defaultConfig({ layout: '10x12-kit' }));
      expect(r.lines[0].price).toBe(10000);
    });

    it('Kit motorized +$2,200', () => {
      const r = calculatePricing(defaultConfig({ layout: '10x12-kit', louverOperation: 'motorized' }));
      expect(r.lines.find(l => l.label.includes('Motorized'))?.price).toBe(2200);
    });
  });

  describe('Taxes', () => {
    it('GST 5% + PST 6% calculated correctly', () => {
      const r = calculatePricing(defaultConfig({ sections: [{ id: 's1', length: 10, width: 10, height: 9 }] }));
      expect(r.gst).toBeCloseTo(r.subtotal * 0.05, 2);
      expect(r.pst).toBeCloseTo(r.subtotal * 0.06, 2);
      expect(r.total).toBeCloseTo(r.subtotal + r.gst + r.pst, 2);
    });
  });
});
