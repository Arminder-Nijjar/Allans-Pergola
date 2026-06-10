import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReviewStep from '../components/steps/ReviewStep';
import { HEATER_MODELS } from '../components/steps/AddOnsStep';
import { DEFAULT_CONFIG } from '../data/catalog';

const render = (cfg) =>
  renderToStaticMarkup(<ReviewStep cfg={cfg} stepNum={9} total={10} />);

const cfgWith = (over = {}) => ({ ...DEFAULT_CONFIG, ...over });

describe('ReviewStep', () => {
  test('renders default config without crashing', () => {
    const html = render(cfgWith());
    expect(html).toContain('Review your design');
    expect(html).toContain('Freestanding');
    expect(html).toContain('12 ft × 10 ft × 9 ft');
  });

  test('shows "None" for add-ons when nothing selected', () => {
    const html = render(cfgWith({ addOns: {} }));
    expect(html).toContain('Add-ons');
    expect(html).toContain('None');
  });

  test('lists fan, tv and outlets when selected', () => {
    const html = render(cfgWith({ addOns: { fan: true, tv: true, outlets: true } }));
    expect(html).toContain('Fan');
    expect(html).toContain('TV');
    expect(html).toContain('Outlets');
  });

  test('shows heater with type, fuel, model and colour', () => {
    const html = render(cfgWith({
      addOns: {
        heater: true,
        heaterType: 'wall-mounted',
        heaterModel: 'tungsten-electric',
        heaterColor: 'black',
      },
    }));
    expect(html).toContain('Wall-Mounted');
    expect(html).toContain('Electric');
    expect(html).toContain('Tungsten Smart-Heat');
    expect(html).toContain('Black');
  });

  test('review model map covers every heater model in the add-ons catalog', () => {
    for (const m of HEATER_MODELS) {
      const html = render(cfgWith({
        addOns: { heater: true, heaterType: m.types[0], heaterModel: m.id },
      }));
      expect(html).toContain(m.label);
      expect(html).toContain(m.fuel);
    }
  });

  test('kit review shows fixed louver text and kit style', () => {
    const html = render(cfgWith({
      layout: '10x12-kit',
      style: '10x12-kit',
      kitLouverOperation: 'motorized',
      kitLightSides: 'front-back',
    }));
    expect(html).toContain('10×12 Standard Kit');
    expect(html).toContain('10×12 Kit');
    expect(html).toContain('manual (optional: motorized/phone-controlled)');
    expect(html).toContain('12 ft sides');
  });

  test('attached style shows the attached side', () => {
    const html = render(cfgWith({ style: 'attached', attachedSide: 'left' }));
    expect(html).toContain('Attached (on left)');
  });

  test('walls and screens render when present', () => {
    const html = render(cfgWith({
      walls: [{ sectionId: 'section-1', side: 'front', segIdx: 0, color: 'white', gap: 0 }],
      screens: [{ sectionId: 'section-1', side: 'left', segIdx: 0, color: 'beige' }],
    }));
    expect(html).toContain('front');
    expect(html).toContain('White');
  });
});
