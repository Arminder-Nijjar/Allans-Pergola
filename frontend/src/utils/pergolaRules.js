// Computed properties derived from the pergola rules - Section-aware version
import { LIMITS } from '../data/catalog';
import { mapLShapeConfig, getLShapeBackFrontIndicator, isSideFullyInterior } from './pergolaLayout';

// Get section by ID
function getSection(cfg, sectionId) {
  return cfg.sections.find(s => s.id === sectionId) || cfg.sections[0];
}

// Simple check if a side is the attached side (house wall side)
// Check if this specific wall in cfg.walls is the attached house wall
export function isAttachedSide(cfg, sectionId, side) {
  if (cfg.style !== 'attached') return false;
  // Single-section app: the attached (house wall) side applies to every section
  return side === cfg.attachedSide;
}

// Smaller dimension determines the louver direction (louvers run across this).
export function smallerDim(section) {
  return Math.min(section.length, section.width);
}

export function largerDim(section) {
  return Math.max(section.length, section.width);
}

// Number of louver sets needed for a section.
// Per spec: If smaller dimension ≤ 15 ft, default to 1 set.
// Examples show: 10x12 (1), 12x16 (1), 12x27 (2), 16x25 (2), 20x30 (2)
// Pattern: Split based on LARGER dimension > 16 ft (boundary at 12x16)
export function louverSetCount(section) {
  const larger = largerDim(section);
  // If larger dimension ≤ 16 ft → 1 set (matches 10x12 and 12x16 examples)
  if (larger <= 16) return 1;
  // Otherwise split larger dimension into ≤15-ft sets
  return Math.ceil(larger / LIMITS.louver.maxSpan);
}

// Louver operation rule:
//   Manual if ≤ 12×16 (or 16×12), motorized if > 12×12.
//   10×12 kit: follows kitLouverOperation config (manual / motorized / phone-controlled).
export function louverOperation(section, cfg) {
  if (cfg?.layout === '10x12-kit') return cfg.kitLouverOperation || 'motorized';
  const L = Math.min(section.length, section.width);
  const W = Math.max(section.length, section.width);
  if (L <= 12 && W <= 16) return 'manual';
  return 'motorized';
}

// Screen operation: motorized if bigger than 10×12, else manual.
export function screenOperation(section) {
  const L = Math.min(section.length, section.width);
  const W = Math.max(section.length, section.width);
  if (L <= 10 && W <= 12) return 'manual';
  return 'motorized';
}

// Posts: 4 corners + automatic extra support posts when any side >= 15 ft.
// For attached: the attached side has 0 corner posts (replaced by horizontal beam),
// but extra support posts still apply to other long sides.
// Accessory posts: users can add multiple accessory posts to any side.
// Position keys: `${sectionId}-${side}-${index}` (index 0, 1, 2...)
export function postPlan(cfg, sectionId) {
  const section = getSection(cfg, sectionId);

  const sides = ['front', 'back', 'left', 'right'].map((s) => {
    const isHoriz = s === 'front' || s === 'back';
    const len = isHoriz ? section.length : section.width;
    const isAttached = isAttachedSide(cfg, sectionId, s);
    return { id: s, length: len, isAttached, isHoriz };
  });

  const isAttached = cfg.style === 'attached';
  let cornerPosts = isAttached ? 2 : 4;
  if (isAttached) {
    const freeSideLen = sides.find((s) => s.id === oppositeSide(cfg.attachedSide))?.length || 0;
    if (freeSideLen >= LIMITS.extraSupportThreshold) cornerPosts = 4;
  }

  // optionalExtraPosts shape: { sectionId: { side: count } }
  const optionalExtraPosts = cfg.optionalExtraPosts || {};
  const sectionOptional = optionalExtraPosts[sectionId] || {};

  let extras = 0;
  const extraSides = [];
  const extraSideCounts = {};
  const mandatoryExtraSides = [];
  const extraPosts = []; // { side, index, isMandatory, positionKey, position }

  for (const s of sides) {
    if (s.isAttached) continue;

    const isMandatory = s.length >= LIMITS.extraSupportThreshold;
    const optionalCount = sectionOptional[s.id] || 0;
    const totalCount = (isMandatory ? 1 : 0) + optionalCount;

    if (totalCount > 0) {
      extraSides.push(s.id);
      extraSideCounts[s.id] = totalCount;
      extras += totalCount;
      if (isMandatory) mandatoryExtraSides.push(s.id);

      for (let i = 0; i < totalCount; i++) {
        const isThisMandatory = isMandatory && i === 0;
        const positionKey = `${sectionId}-${s.id}-${i}`;
        // Evenly spaced defaults: e.g. 2 posts on 16ft => 16/3 and 32/3
        const defaultPos = s.length * (i + 1) / (totalCount + 1);
        const position = cfg.extraPostPositions?.[positionKey] ?? defaultPos;
        extraPosts.push({ side: s.id, index: i, isMandatory: isThisMandatory, positionKey, position });
      }
    }
  }

  return {
    cornerPosts,
    extras,
    extraSides,
    extraSideCounts,
    mandatoryExtraSides,
    extraPosts,
    total: cornerPosts + extras,
  };
}

export function oppositeSide(side) {
  return { front: 'back', back: 'front', left: 'right', right: 'left' }[side];
}

// Whether walls/screens are allowed on a side. Rules:
//  - Can be placed on ALL sides if at least 1 segment remains open
//  - Walls and screens cannot overlap on the same segment.
//  - For attached pergolas, the attached side cannot host a wall or screen (per section).
export function canPlaceOnSide(cfg, kind, sectionId, side) {
  if (isAttachedSide(cfg, sectionId, side)) return false;
  
  // Check if this specific segment already has a wall or screen
  const segments = segmentsForSide(cfg, sectionId, side);
  const list = kind === 'wall' ? cfg.walls : cfg.screens;
  const otherList = kind === 'wall' ? cfg.screens : cfg.walls;
  
  // Check all segments on this side
  for (const seg of segments) {
    const hasWall = cfg.walls.some(w => w.sectionId === sectionId && w.side === side && (w.segmentIdx === seg.idx || w.segmentIdx == null));
    const hasScreen = cfg.screens.some(s => s.sectionId === sectionId && s.side === side && (s.segmentIdx === seg.idx || s.segmentIdx == null));
    
    // Can add if this segment doesn't have the same kind already
    if (kind === 'wall' && !hasWall) return true;
    if (kind === 'screen' && !hasScreen) return true;
  }
  
  return false;
}

// Check if at least one segment remains open (no wall or screen)
export function hasOpenSegment(cfg) {
  for (const section of cfg.sections) {
    const sides = ['front', 'back', 'left', 'right'];
    for (const side of sides) {
      if (isAttachedSide(cfg, section.id, side)) continue;
      const segments = segmentsForSide(cfg, section.id, side);
      for (const seg of segments) {
        const hasWall = cfg.walls.some(w => w.sectionId === section.id && w.side === side && (w.segmentIdx === seg.idx || w.segmentIdx == null));
        const hasScreen = cfg.screens.some(s => s.sectionId === section.id && s.side === side && (s.segmentIdx === seg.idx || s.segmentIdx == null));
        if (!hasWall && !hasScreen) return true;
      }
    }
  }
  return false;
}

// Number of segments along a given side (each side has 1 segment unless an extra post splits it).
// For L-shape junctions, includes corner posts from the adjacent section so walls span both sections.
export function segmentsForSide(cfg, sectionId, side) {
  const section = getSection(cfg, sectionId);
  const plan = postPlan(cfg, sectionId);
  const isHoriz = side === 'front' || side === 'back';
  const len = isHoriz ? section.length : section.width;
  const segments = [];

  // Collect all post positions on this side (corners at 0 and len, plus any extra posts)
  const postPositions = [0]; // Start corner

  // Add ALL extra post positions on this side
  const sideExtraPosts = plan.extraPosts.filter((p) => p.side === side);
  for (const post of sideExtraPosts) {
    postPositions.push(post.position);
  }

  // For L-shape junctions, add the adjacent section's corner post positions
  // so walls can span between posts of both sections
  // Handles all 4 configs: left-back, right-back, left-front, right-front
  if (cfg.layout === 'l-shape' && cfg.sections.length === 2) {
    const configId = cfg.lShapeConfig || 'right-back';
    const otherSection = cfg.sections.find(s => s.id !== sectionId);
    if (!otherSection) return segments;

    // Determine junction sides based on the 4 L-shape configs
    const isBackVariant = configId.includes('back');
    const isFrontVariant = configId.includes('front');
    const isLeftVariant = configId.includes('left');
    const isRightVariant = configId.includes('right');

    if (isBackVariant) {
      // Back variants: Section 2 is BEHIND Section 1
      if (isRightVariant) {
        // right-back: Section 2 to the right, extending back
        // Junction: Section 1's right meets Section 2's left
        if (sectionId === 'section-1' && side === 'right') {
          const otherWidth = otherSection.width;
          if (otherWidth > 0 && otherWidth < len) {
            postPositions.push(otherWidth);
            console.log(`[segmentsForSide] ${sectionId}.${side} back-right: added otherWidth=${otherWidth}`);
          }
        } else if (sectionId === 'section-2' && side === 'left') {
          const thisWidth = section.width;
          const otherWidth = otherSection.width;
          if (otherWidth > 0 && otherWidth < thisWidth) {
            postPositions.push(otherWidth);
            console.log(`[segmentsForSide] ${sectionId}.${side} back-right: added otherWidth=${otherWidth}`);
          }
        }
      } else if (isLeftVariant) {
        // left-back: Section 2 to the left, extending back
        // Junction: Section 1's left meets Section 2's right
        if (sectionId === 'section-1' && side === 'left') {
          const otherWidth = otherSection.width;
          if (otherWidth > 0 && otherWidth < len) {
            postPositions.push(otherWidth);
            console.log(`[segmentsForSide] ${sectionId}.${side} back-left: added otherWidth=${otherWidth}`);
          }
        } else if (sectionId === 'section-2' && side === 'right') {
          const thisWidth = section.width;
          const otherWidth = otherSection.width;
          if (otherWidth > 0 && otherWidth < thisWidth) {
            postPositions.push(otherWidth);
            console.log(`[segmentsForSide] ${sectionId}.${side} back-left: added otherWidth=${otherWidth}`);
          }
        }
      }
    } else if (isFrontVariant) {
      // Front variants: Section 2 is IN FRONT OF Section 1
      if (isRightVariant) {
        // right-front: Section 2 to the right, extending forward
        // Junction: Section 1's right meets Section 2's left (at front)
        if (sectionId === 'section-1' && side === 'right') {
          const otherWidth = otherSection.width;
          if (otherWidth > 0 && otherWidth < len) {
            postPositions.push(otherWidth);
            console.log(`[segmentsForSide] ${sectionId}.${side} front-right: added otherWidth=${otherWidth}`);
          }
        } else if (sectionId === 'section-2' && side === 'left') {
          const thisWidth = section.width;
          const otherWidth = otherSection.width;
          if (otherWidth > 0 && otherWidth < thisWidth) {
            // Junction post is at (thisWidth - otherWidth) from the start
            const junctionPos = thisWidth - otherWidth;
            postPositions.push(junctionPos);
            console.log(`[segmentsForSide] ${sectionId}.${side} front-right: added junctionPos=${junctionPos} (thisWidth=${thisWidth}, otherWidth=${otherWidth})`);
          }
        }
      } else if (isLeftVariant) {
        // left-front: Section 2 to the left, extending forward
        // Junction: Section 1's left meets Section 2's right (at front)
        if (sectionId === 'section-1' && side === 'left') {
          const otherWidth = otherSection.width;
          if (otherWidth > 0 && otherWidth < len) {
            postPositions.push(otherWidth);
            console.log(`[segmentsForSide] ${sectionId}.${side} front-left: added otherWidth=${otherWidth}`);
          }
        } else if (sectionId === 'section-2' && side === 'right') {
          const thisWidth = section.width;
          const otherWidth = otherSection.width;
          if (otherWidth > 0 && otherWidth < thisWidth) {
            // Junction post is at (thisWidth - otherWidth) from the start
            const junctionPos = thisWidth - otherWidth;
            postPositions.push(junctionPos);
            console.log(`[segmentsForSide] ${sectionId}.${side} front-left: added junctionPos=${junctionPos} (thisWidth=${thisWidth}, otherWidth=${otherWidth})`);
          }
        }
      }
    }
  }

  postPositions.push(len); // End corner

  // Sort positions and remove duplicates
  const sortedPositions = [...new Set(postPositions)].sort((a, b) => a - b);

  // Create segments between consecutive posts
  // Reverse indices so outer segment (near corner) is idx 0 (shown as Segment 1)
  const totalSegments = sortedPositions.length - 1;
  for (let i = 0; i < totalSegments; i++) {
    const start = sortedPositions[i];
    const end = sortedPositions[i + 1];
    const length = end - start;
    // Reverse the index: outer segment gets lower index
    const idx = totalSegments - 1 - i;
    segments.push({ idx, start, end, length });
  }
  // Sort by idx to maintain proper order
  segments.sort((a, b) => a.idx - b.idx);

  console.log(`[segmentsForSide] ${sectionId}.${side}: positions=[${sortedPositions.join(',')}], segments=${JSON.stringify(segments)}`);
  return segments;
}

// Format helper.
export function fmtFt(n) {
  if (Number.isInteger(n)) return `${n} ft`;
  return `${n.toFixed(1)} ft`;
}
