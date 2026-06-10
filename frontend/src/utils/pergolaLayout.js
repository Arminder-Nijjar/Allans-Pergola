// Multi-section geometry helpers for the 3D scene
// Section 2 attaches to Section 1's LEFT, RIGHT, or FRONT side with FULL edge sharing.

const FT_TO_M = 0.3048;

export { FT_TO_M };

/**
 * Map user-friendly L-shape config IDs to internal position values.
 * User configs: left-back, right-back, left-front, right-front
 * Internal: left, right, front
 */
export function mapLShapeConfig(configId) {
  const mapping = {
    'left-back': 'left',      // Section 2 LEFT from BACK
    'right-back': 'right',    // Section 2 RIGHT from BACK
    'left-front': 'left',     // Section 2 LEFT from FRONT
    'right-front': 'right',   // Section 2 RIGHT from FRONT
  };
  // Handle both new and legacy config IDs
  return mapping[configId] || configId;
}

/**
 * Get the back/front indicator for L-shape config.
 * Returns 'back' or 'front' based on whether Section 2 attaches to BACK or FRONT of Section 1.
 */
export function getLShapeBackFrontIndicator(configId) {
  const backConfigs = ['left-back', 'right-back'];
  const frontConfigs = ['left-front', 'right-front'];
  
  if (backConfigs.includes(configId)) return 'back';
  if (frontConfigs.includes(configId)) return 'front';
  
  // Legacy support - if using 'front' internal value, assume it's a front attachment
  return configId === 'front' ? 'front' : 'back';
}

/**
 * Calculate Section 2's position based on L-shape config.
 * Section 2 attaches to Section 1's left, right, or front side with FULL edge sharing.
 *
 * L-shape configs (lShapeConfig):
 *  - 'right-back': Section 2 to RIGHT of Section 1 (section 2's left edge = section 1's right edge)
 *  - 'left-back':  Section 2 to LEFT of Section 1  (section 2's right edge = section 1's left edge)
 *  - 'right-front': Section 2 in FRONT of Section 1 (section 2's back edge = section 1's front edge)
 *  - 'left-front':  Section 2 in FRONT-LEFT of Section 1 (section 2's back edge = section 1's front edge)
 *
 * In all cases, Section 2 is aligned with Section 1 along the shared axis (back-aligned for left/right, left-aligned for front).
 */
function getSection2Position(cfg, w1, d1, w2, d2) {
  const configId = cfg.lShapeConfig || 'right-back';

  // 4 L-shapes created by rotating the base L 90 degrees each time
  // All shapes share a corner with Section 1 (no gaps)
  switch (configId) {
    case 'left-back':
      // └ shape: Section 2 extends LEFT from Section 1's back-left corner
      return {
        x: -w2,
        z: 0,
        interiorMap: {
          'section-1': { back: false, front: false, left: true, right: false },
          'section-2': { back: false, front: false, left: false, right: true },
        },
      };
    case 'right-back':
      // ┌ shape: Section 2 extends RIGHT from Section 1's back-right corner
      return {
        x: w1,
        z: 0,
        interiorMap: {
          'section-1': { back: false, front: false, left: false, right: true },
          'section-2': { back: false, front: false, left: true, right: false },
        },
      };
    case 'left-front':
      // ┐ shape: Section 2 extends FORWARD-LEFT from Section 1's front-left corner
      // Rotated 180° from left-back - Section 2 extends forward (positive z)
      return {
        x: -w2,
        z: d1 - d2,  // Align Section 2's back with Section 1's front
        interiorMap: {
          'section-1': { back: false, front: false, left: true, right: false },
          'section-2': { back: true, front: false, left: false, right: true },
        },
      };
    case 'right-front':
      // ┘ shape: Section 2 extends FORWARD-RIGHT from Section 1's front-right corner
      // Rotated 180° from right-back - Section 2 extends forward (positive z)
      return {
        x: w1,
        z: d1 - d2,  // Align Section 2's back with Section 1's front
        interiorMap: {
          'section-1': { back: false, front: false, left: false, right: true },
          'section-2': { back: true, front: false, left: true, right: false },
        },
      };
    // Legacy/internal support
    case 'left':
      return {
        x: -w2,
        z: 0,
        interiorMap: {
          'section-1': { back: false, front: false, left: true, right: false },
          'section-2': { back: false, front: false, left: false, right: true },
        },
      };
    case 'right':
      return {
        x: w1,
        z: 0,
        interiorMap: {
          'section-1': { back: false, front: false, left: false, right: true },
          'section-2': { back: false, front: false, left: true, right: false },
        },
      };
    case 'front':
      return {
        x: 0,
        z: d1,
        interiorMap: {
          'section-1': { back: false, front: true, left: false, right: false },
          'section-2': { back: true, front: false, left: false, right: false },
        },
      };
    default:
      return { x: w1, z: 0, interiorMap: {} };
  }
}

export function getModules(cfg) {
  const modules = [];

  if (cfg.layout === 'horizontal' || cfg.layout === '10x12-kit') {
    const positioned = new Set();
    const moduleMap = {};

    const root = cfg.sections.find((s) => s.id === 'section-1') || cfg.sections[0];
    if (root) {
      moduleMap[root.id] = {
        id: root.id,
        sectionId: root.id,
        x: 0,
        z: 0,
        w: root.length * FT_TO_M,
        d: root.width * FT_TO_M,
        h: root.height * FT_TO_M,
        length: root.length,
        width: root.width,
        height: root.height,
      };
      positioned.add(root.id);
    }

    // BFS: position all sections attached to already-positioned ones
    const queue = [root?.id].filter(Boolean);
    while (queue.length > 0) {
      const parentId = queue.shift();
      const parentMod = moduleMap[parentId];
      if (!parentMod) continue;

      const children = cfg.sections.filter((s) => s.attachTo === parentId);
      for (const child of children) {
        if (positioned.has(child.id)) continue;
        const w = child.length * FT_TO_M;
        const d = child.width * FT_TO_M;
        let x = parentMod.x, z = parentMod.z;
        if (child.attachSide === 'right') { x = parentMod.x + parentMod.w; z = parentMod.z; }
        else if (child.attachSide === 'left') { x = parentMod.x - w; z = parentMod.z; }
        else if (child.attachSide === 'front') { x = parentMod.x; z = parentMod.z + parentMod.d; }
        else if (child.attachSide === 'back') { x = parentMod.x; z = parentMod.z - d; }

        moduleMap[child.id] = {
          id: child.id, sectionId: child.id,
          x, z, w, d,
          h: child.height * FT_TO_M,
          length: child.length, width: child.width, height: child.height,
        };
        positioned.add(child.id);
        queue.push(child.id);
      }
    }

    cfg.sections.forEach((s) => {
      if (moduleMap[s.id]) modules.push(moduleMap[s.id]);
    });
  } else if (cfg.layout === 'l-shape') {
    const s1 = cfg.sections[0];
    const s2 = cfg.sections[1];

    const w1 = s1.length * FT_TO_M;
    const d1 = s1.width * FT_TO_M;
    const w2 = s2.length * FT_TO_M;
    const d2 = s2.width * FT_TO_M;

    const pos2 = getSection2Position(cfg, w1, d1, w2, d2);

    modules.push({
      id: s1.id,
      sectionId: s1.id,
      x: 0,
      z: 0,
      w: w1,
      d: d1,
      h: s1.height * FT_TO_M,
      length: s1.length,
      width: s1.width,
      height: s1.height,
    });

    modules.push({
      id: s2.id,
      sectionId: s2.id,
      x: pos2.x,
      z: pos2.z,
      w: w2,
      d: d2,
      h: s2.height * FT_TO_M,
      length: s2.length,
      width: s2.width,
      height: s2.height,
    });

    modules.__interiorMap = pos2.interiorMap;
  }

  return modules;
}

export function isSideFullyInterior(cfg, sectionId, side) {
  console.log(`[isSideFullyInterior] checking ${sectionId}.${side}, layout=${cfg.layout}, lShapeConfig=${cfg.lShapeConfig}`);

  // L-shape: use the interior map from module positioning
  if (cfg.layout === 'l-shape') {
    const modules = getModules(cfg);
    const map = modules.__interiorMap || {};
    const sectionMap = map[sectionId] || {};
    return sectionMap[side] === true;
  }

  // Horizontal multi-section: a side is interior if another section shares that edge
  if (cfg.layout === 'horizontal' || cfg.layout === '10x12-kit') {
    const section = cfg.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    // Check if a child section attaches directly to this side
    const hasChild = cfg.sections.some((s) => s.attachTo === sectionId && s.attachSide === side);
    if (hasChild) return true;

    // Check if this section attaches to a parent and this side faces the parent
    if (section.attachTo) {
      const opposite = { front: 'back', back: 'front', left: 'right', right: 'left' }[side];
      if (section.attachSide === opposite) return true;
    }
  }

  return false;
}

export function isSidePartiallyInterior(cfg, sectionId, side) {
  return false; // No partial interior in this simpler model
}

export function getPartialInteriorType(cfg, sectionId, side) {
  return null;
}

/**
 * Get all unique corner points from modules
 */
function getAllModuleCorners(modules) {
  const corners = [];
  modules.forEach((m, idx) => {
    corners.push(
      { x: m.x, z: m.z, moduleIdx: idx, corner: 'bl' }, // bottom-left
      { x: m.x + m.w, z: m.z, moduleIdx: idx, corner: 'br' }, // bottom-right
      { x: m.x + m.w, z: m.z + m.d, moduleIdx: idx, corner: 'fr' }, // front-right
      { x: m.x, z: m.z + m.d, moduleIdx: idx, corner: 'fl' } // front-left
    );
  });
  return corners;
}

/**
 * Check if two corners are at the same position (shared corner)
 */
function areCornersShared(c1, c2, epsilon = 0.02) {
  return Math.abs(c1.x - c2.x) < epsilon && Math.abs(c1.z - c2.z) < epsilon;
}

/**
 * Get all unique corners (shared corners counted once)
 */
function getUniqueCorners(modules) {
  const allCorners = getAllModuleCorners(modules);
  const unique = [];
  
  allCorners.forEach((corner) => {
    const isDuplicate = unique.some((u) => areCornersShared(u, corner));
    if (!isDuplicate) {
      unique.push(corner);
    }
  });
  
  return unique;
}

/**
 * Determine if a corner is on the exterior of the combined structure
 * by checking if it's on the convex hull
 */
function isExteriorCorner(corner, allCorners, modules) {
  // Find min/max bounds
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  allCorners.forEach((c) => {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minZ = Math.min(minZ, c.z);
    maxZ = Math.max(maxZ, c.z);
  });
  
  // Corner is exterior if it's on the outer bounds
  const onOuterX = Math.abs(corner.x - minX) < 0.02 || Math.abs(corner.x - maxX) < 0.02;
  const onOuterZ = Math.abs(corner.z - minZ) < 0.02 || Math.abs(corner.z - maxZ) < 0.02;
  
  return onOuterX || onOuterZ;
}

/**
 * Get transition posts for size-mismatched sections
 * When connected sections have different sizes, we need posts at the transition points
 */
function getTransitionPosts(cfg, modules) {
  if (modules.length !== 2) return [];
  
  const m1 = modules[0];
  const m2 = modules[1];
  const configId = cfg.lShapeConfig || 'right-back';
  const config = mapLShapeConfig(configId);
  const posts = [];
  const eps = 0.02;
  
  switch (config) {
    case 'right': {
      // m2 is to the right of m1, back-aligned
      // Check for depth mismatch
      if (Math.abs(m1.d - m2.d) > eps) {
        const junctionX = m1.x + m1.w;
        // The section with greater depth extends beyond the shared edge
        if (m1.d > m2.d) {
          // m1 extends further forward - need post at the step
          posts.push({ pos: [junctionX, m2.z + m2.d], id: 'transition-m1-front' });
        } else if (m2.d > m1.d) {
          // m2 extends further forward - need post at the step
          posts.push({ pos: [junctionX, m1.z + m1.d], id: 'transition-m2-front' });
        }
      }
      break;
    }
    case 'left': {
      // m2 is to the left of m1, back-aligned
      if (Math.abs(m1.d - m2.d) > eps) {
        const junctionX = m1.x;
        if (m1.d > m2.d) {
          posts.push({ pos: [junctionX, m2.z + m2.d], id: 'transition-m1-front' });
        } else if (m2.d > m1.d) {
          posts.push({ pos: [junctionX, m1.z + m1.d], id: 'transition-m2-front' });
        }
      }
      break;
    }
    case 'front': {
      // m2 is in front of m1, left-aligned
      if (Math.abs(m1.w - m2.w) > eps) {
        const junctionZ = m1.z + m1.d;
        if (m1.w > m2.w) {
          posts.push({ pos: [m2.x + m2.w, junctionZ], id: 'transition-m1-right' });
        } else if (m2.w > m1.w) {
          posts.push({ pos: [m1.x + m1.w, junctionZ], id: 'transition-m2-right' });
        }
      }
      break;
    }
  }
  
  return posts;
}

/**
 * L-shape support posts at the junction between section 1 and section 2.
 * Placed at the corners along the shared edge for structural support.
 * Handles size mismatches by adding transition posts.
 */
export function getLShapeSupportPosts(cfg, modules) {
  if (cfg.layout !== 'l-shape' || modules.length !== 2) return [];

  const m1 = modules[0];
  const m2 = modules[1];
  const posts = [];
  const configId = cfg.lShapeConfig || 'right-back';
  const config = mapLShapeConfig(configId);
  
  // Get all unique exterior corners
  const uniqueCorners = getUniqueCorners(modules);
  const allCorners = getAllModuleCorners(modules);
  
  // Find exterior corners that are part of the junction
  const junctionPosts = [];
  
  switch (config) {
    case 'right': {
      const x = m1.x + m1.w;
      const z0a = m1.z;
      const z1a = m1.z + m1.d;
      const z0b = m2.z;
      const z1b = m2.z + m2.d;
      
      // Shared segment endpoints
      const sharedStart = Math.max(z0a, z0b);
      const sharedEnd = Math.min(z1a, z1b);
      
      if (sharedStart < sharedEnd - 0.05) {
        // Add posts at shared edge endpoints (if not already covered by section corners)
        const startCorner = uniqueCorners.find(c => 
          Math.abs(c.x - x) < 0.02 && Math.abs(c.z - sharedStart) < 0.02
        );
        const endCorner = uniqueCorners.find(c => 
          Math.abs(c.x - x) < 0.02 && Math.abs(c.z - sharedEnd) < 0.02
        );
        
        if (!startCorner) {
          junctionPosts.push({ pos: [x, sharedStart], id: 'junction-start' });
        }
        if (!endCorner) {
          junctionPosts.push({ pos: [x, sharedEnd], id: 'junction-end' });
        }
      }
      break;
    }
    case 'left': {
      const x = m1.x;
      const z0a = m1.z;
      const z1a = m1.z + m1.d;
      const z0b = m2.z;
      const z1b = m2.z + m2.d;
      
      const sharedStart = Math.max(z0a, z0b);
      const sharedEnd = Math.min(z1a, z1b);
      
      if (sharedStart < sharedEnd - 0.05) {
        const startCorner = uniqueCorners.find(c => 
          Math.abs(c.x - x) < 0.02 && Math.abs(c.z - sharedStart) < 0.02
        );
        const endCorner = uniqueCorners.find(c => 
          Math.abs(c.x - x) < 0.02 && Math.abs(c.z - sharedEnd) < 0.02
        );
        
        if (!startCorner) {
          junctionPosts.push({ pos: [x, sharedStart], id: 'junction-start' });
        }
        if (!endCorner) {
          junctionPosts.push({ pos: [x, sharedEnd], id: 'junction-end' });
        }
      }
      break;
    }
    case 'front': {
      const z = m1.z + m1.d;
      const x0a = m1.x;
      const x1a = m1.x + m1.w;
      const x0b = m2.x;
      const x1b = m2.x + m2.w;
      
      const sharedStart = Math.max(x0a, x0b);
      const sharedEnd = Math.min(x1a, x1b);
      
      if (sharedStart < sharedEnd - 0.05) {
        const startCorner = uniqueCorners.find(c => 
          Math.abs(c.z - z) < 0.02 && Math.abs(c.x - sharedStart) < 0.02
        );
        const endCorner = uniqueCorners.find(c => 
          Math.abs(c.z - z) < 0.02 && Math.abs(c.x - sharedEnd) < 0.02
        );
        
        if (!startCorner) {
          junctionPosts.push({ pos: [sharedStart, z], id: 'junction-start' });
        }
        if (!endCorner) {
          junctionPosts.push({ pos: [sharedEnd, z], id: 'junction-end' });
        }
      }
      break;
    }
  }
  
  // Add transition posts for size mismatches
  const transitionPosts = getTransitionPosts(cfg, modules);
  
  // Combine and deduplicate
  const allPosts = [...junctionPosts, ...transitionPosts];
  const uniquePosts = [];
  
  allPosts.forEach((p) => {
    const isDuplicate = uniquePosts.some((u) => 
      Math.abs(u.pos[0] - p.pos[0]) < 0.05 && Math.abs(u.pos[1] - p.pos[1]) < 0.05
    );
    if (!isDuplicate) {
      uniquePosts.push(p);
    }
  });
  
  return uniquePosts;
}

/**
 * Validate that all exterior corners have support posts
 * Returns array of unsupported corner positions that need posts
 */
export function validateStructuralSupport(cfg, modules) {
  const issues = [];
  const allCorners = getAllModuleCorners(modules);
  const uniqueCorners = getUniqueCorners(modules);
  
  // For L-shape, check each exterior corner
  if (cfg.layout === 'l-shape' && modules.length === 2) {
    const m1 = modules[0];
    const m2 = modules[1];
    const configId = cfg.lShapeConfig || 'right-back';
    const config = mapLShapeConfig(configId);
    const bbox = getBoundingBox(modules);
    
    // Get all corners that should have posts
    const requiredPosts = [];
    
    // Add all unique exterior corners
    uniqueCorners.forEach((c) => {
      if (isExteriorCorner(c, allCorners, modules)) {
        requiredPosts.push({ x: c.x, z: c.z });
      }
    });
    
    // For attached style, remove posts on attached side
    if (cfg.style === 'attached' && cfg.attachedSide) {
      const attachedSide = cfg.attachedSide;
      return requiredPosts.filter((p) => {
        if (attachedSide === 'back') return Math.abs(p.z - bbox.minZ) > 0.1;
        if (attachedSide === 'front') return Math.abs(p.z - bbox.maxZ) > 0.1;
        if (attachedSide === 'left') return Math.abs(p.x - bbox.minX) > 0.1;
        if (attachedSide === 'right') return Math.abs(p.x - bbox.maxX) > 0.1;
        return true;
      });
    }
    
    return requiredPosts;
  }
  
  return issues;
}

export function getBoundingBox(modules) {
  if (modules.length === 0) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, centerX: 0, centerZ: 0, width: 0, depth: 0 };
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  modules.forEach((mod) => {
    minX = Math.min(minX, mod.x);
    maxX = Math.max(maxX, mod.x + mod.w);
    minZ = Math.min(minZ, mod.z);
    maxZ = Math.max(maxZ, mod.z + mod.d);
  });
  return {
    minX, maxX, minZ, maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

/**
 * Get beam segments for lighting - traces actual beam paths per module
 * Returns array of segments with start/end points for each module's beams
 */
export function getBeamSegments(modules, cfg) {
  const segments = [];

  modules.forEach((mod, idx) => {
    const x0 = mod.x;
    const x1 = mod.x + mod.w;
    const z0 = mod.z;
    const z1 = mod.z + mod.d;

    // Determine which sides have beams - skip attached side
    const hasBackBeam = !cfg || cfg.style !== 'attached' || cfg.attachedSide !== 'back';
    const hasFrontBeam = !cfg || cfg.style !== 'attached' || cfg.attachedSide !== 'front';
    const hasLeftBeam = !cfg || cfg.style !== 'attached' || cfg.attachedSide !== 'left';
    const hasRightBeam = !cfg || cfg.style !== 'attached' || cfg.attachedSide !== 'right';
    
    // Check interior sides for L-shape or horizontal multi-section
    let isBackInterior = false;
    let isFrontInterior = false;
    let isLeftInterior = false;
    let isRightInterior = false;

    if (cfg && (cfg.layout === 'l-shape' || cfg.layout === 'horizontal' || cfg.layout === '10x12-kit')) {
      isBackInterior = isSideFullyInterior(cfg, mod.sectionId, 'back');
      isFrontInterior = isSideFullyInterior(cfg, mod.sectionId, 'front');
      isLeftInterior = isSideFullyInterior(cfg, mod.sectionId, 'left');
      isRightInterior = isSideFullyInterior(cfg, mod.sectionId, 'right');
    }
    
    // Add beam segments for this module (interior sides don't have beams)
    if (hasBackBeam && !isBackInterior) {
      segments.push({
        moduleIdx: idx,
        side: 'back',
        p1: { x: x0, z: z0 },
        p2: { x: x1, z: z0 },
        length: x1 - x0
      });
    }
    if (hasFrontBeam && !isFrontInterior) {
      segments.push({
        moduleIdx: idx,
        side: 'front',
        p1: { x: x0, z: z1 },
        p2: { x: x1, z: z1 },
        length: x1 - x0
      });
    }
    if (hasLeftBeam && !isLeftInterior) {
      segments.push({
        moduleIdx: idx,
        side: 'left',
        p1: { x: x0, z: z0 },
        p2: { x: x0, z: z1 },
        length: z1 - z0
      });
    }
    if (hasRightBeam && !isRightInterior) {
      segments.push({
        moduleIdx: idx,
        side: 'right',
        p1: { x: x1, z: z0 },
        p2: { x: x1, z: z1 },
        length: z1 - z0
      });
    }
  });
  
  return segments;
}

/**
 * Get perimeter points that FOLLOW THE ACTUAL L-SHAPE OUTLINE (not bounding box).
 * For asymmetric sections this traces a proper L/step path.
 * This is used for legacy lighting and other perimeter-based features.
 */
export function getPerimeterPath(modules, cfg) {
  // Use beam segments to trace the actual outline
  const segments = getBeamSegments(modules, cfg);
  if (segments.length === 0) return [];
  
  // Build a path from connected segments
  const points = [];
  const visited = new Set();
  
  // Start from first segment's p1
  let current = segments[0].p1;
  points.push({ ...current });
  visited.add(0);
  
  // Find connected segments
  let iterations = 0;
  while (visited.size < segments.length && iterations < segments.length * 2) {
    iterations++;
    
    // Find next connected segment
    for (let i = 0; i < segments.length; i++) {
      if (visited.has(i)) continue;
      
      const seg = segments[i];
      const distToP1 = Math.hypot(seg.p1.x - current.x, seg.p1.z - current.z);
      const distToP2 = Math.hypot(seg.p2.x - current.x, seg.p2.z - current.z);
      
      if (distToP1 < 0.05) {
        points.push({ ...seg.p2 });
        current = seg.p2;
        visited.add(i);
        break;
      } else if (distToP2 < 0.05) {
        points.push({ ...seg.p1 });
        current = seg.p1;
        visited.add(i);
        break;
      }
    }
  }
  
  // If we couldn't connect all segments, just use bounding approach as fallback
  if (points.length < 3) {
    return legacyGetPerimeterPath(modules, cfg);
  }
  
  return points;
}

/**
 * Legacy perimeter calculation - used as fallback
 */
function legacyGetPerimeterPath(modules, cfg) {
  if (modules.length === 1) {
    const m = modules[0];
    return [
      { x: m.x, z: m.z },
      { x: m.x + m.w, z: m.z },
      { x: m.x + m.w, z: m.z + m.d },
      { x: m.x, z: m.z + m.d },
    ];
  }
  if (modules.length === 2) {
    const m1 = modules[0];
    const m2 = modules[1];
    const config = cfg && cfg.lShapeConfig ? cfg.lShapeConfig : 'right';
    const eps = 0.02;

    if (config === 'right') {
      const pts = [];
      pts.push({ x: m1.x, z: m1.z });
      pts.push({ x: m2.x + m2.w, z: m2.z });
      pts.push({ x: m2.x + m2.w, z: m2.z + m2.d });
      pts.push({ x: m2.x, z: m2.z + m2.d });
      if (Math.abs(m1.d - m2.d) > eps) {
        pts.push({ x: m1.x + m1.w, z: m1.z + m1.d });
      }
      pts.push({ x: m1.x, z: m1.z + m1.d });
      return pts;
    }
    if (config === 'left') {
      const pts = [];
      pts.push({ x: m2.x, z: m2.z });
      pts.push({ x: m1.x + m1.w, z: m1.z });
      pts.push({ x: m1.x + m1.w, z: m1.z + m1.d });
      pts.push({ x: m1.x, z: m1.z + m1.d });
      if (Math.abs(m1.d - m2.d) > eps) {
        pts.push({ x: m2.x + m2.w, z: m2.z + m2.d });
      }
      pts.push({ x: m2.x, z: m2.z + m2.d });
      return pts;
    }
    if (config === 'front') {
      const pts = [];
      pts.push({ x: m1.x, z: m1.z });
      pts.push({ x: m1.x + m1.w, z: m1.z });
      pts.push({ x: m1.x + m1.w, z: m1.z + m1.d });
      if (Math.abs(m1.w - m2.w) > eps) {
        pts.push({ x: m2.x + m2.w, z: m2.z });
      }
      pts.push({ x: m2.x + m2.w, z: m2.z + m2.d });
      pts.push({ x: m2.x, z: m2.z + m2.d });
      return pts;
    }
  }
  return [];
}

/**
 * Get the house wall segments for attached style.
 * Simple approach: just place a wall on the attachedSide (like a regular wall in step 5).
 */
export function getHouseWallSegments(cfg, modules) {
  if (cfg.style !== 'attached' || !cfg.attachedSide) return [];
  if (modules.length === 0) return [];

  const bbox = getBoundingBox(modules);
  const avgH = modules.reduce((sum, m) => sum + m.h, 0) / modules.length;
  const side = cfg.attachedSide;

  // Simple wall on the attached side (just like step 5 walls)
  if (side === 'back') {
    return [{
      side: 'back',
      x0: bbox.minX,
      x1: bbox.maxX,
      z0: bbox.minZ,
      z1: bbox.minZ,
      height: avgH,
      fixed: true,
    }];
  }
  if (side === 'front') {
    return [{
      side: 'front',
      x0: bbox.minX,
      x1: bbox.maxX,
      z0: bbox.maxZ,
      z1: bbox.maxZ,
      height: avgH,
      fixed: true,
    }];
  }
  if (side === 'left') {
    return [{
      side: 'left',
      x0: bbox.minX,
      x1: bbox.minX,
      z0: bbox.minZ,
      z1: bbox.maxZ,
      height: avgH,
      fixed: true,
    }];
  }
  if (side === 'right') {
    return [{
      side: 'right',
      x0: bbox.maxX,
      x1: bbox.maxX,
      z0: bbox.minZ,
      z1: bbox.maxZ,
      height: avgH,
      fixed: true,
    }];
  }

  return [];
}

export function isSectionActive(cfg, sectionId) {
  return cfg.activeSection === sectionId;
}

export function getSection(cfg, sectionId) {
  return cfg.sections.find((s) => s.id === sectionId) || null;
}

export function isInteriorSide(cfg, sectionId, side) {
  return isSideFullyInterior(cfg, sectionId, side);
}

export function getSidesForSection(cfg, sectionId) {
  // Simple attached check - same for all sections
  return ['front', 'back', 'left', 'right'].map((id) => ({
    id,
    attached: cfg.style === 'attached' && cfg.attachedSide === id,
    interior: isInteriorSide(cfg, sectionId, id),
  }));
}

/**
 * Get available segments/sides for L-shape layout
 * Returns array of segments that can have screens/walls placed on them
 */
export function getLShapeAvailableSides(cfg, modules) {
  if (cfg.layout !== 'l-shape' || modules.length !== 2) return [];
  
  const m1 = modules[0];
  const m2 = modules[1];
  const config = cfg.lShapeConfig || 'right';
  const availableSides = [];
  const eps = 0.02;
  
  // Get perimeter path to determine exterior edges
  const perimeter = getPerimeterPath(modules, cfg);
  
  // Build list of all exterior segments
  if (config === 'right') {
    // m2 to right of m1, back-aligned
    // Section 1: back, left, front (right is interior)
    availableSides.push(
      { sectionId: 'section-1', side: 'back', segmentIdx: 0, x0: m1.x, z: m1.z, x1: m1.x + m1.w },
      { sectionId: 'section-1', side: 'left', segmentIdx: 1, x: m1.x, z0: m1.z, z1: m1.z + m1.d }
    );
    if (Math.abs(m1.d - m2.d) > eps) {
      availableSides.push({ sectionId: 'section-1', side: 'front', segmentIdx: 2, x0: m1.x, z: m1.z + m1.d, x1: m1.x + m1.w });
    }
    
    // Section 2: back, right, front (left is interior)
    availableSides.push(
      { sectionId: 'section-2', side: 'back', segmentIdx: 3, x0: m2.x, z: m2.z, x1: m2.x + m2.w },
      { sectionId: 'section-2', side: 'right', segmentIdx: 4, x: m2.x + m2.w, z0: m2.z, z1: m2.z + m2.d }
    );
    if (Math.abs(m1.d - m2.d) > eps) {
      availableSides.push({ sectionId: 'section-2', side: 'front', segmentIdx: 5, x0: m2.x, z: m2.z + m2.d, x1: m2.x + m2.w });
    }
  } else if (config === 'left') {
    // m2 to left of m1, back-aligned
    availableSides.push(
      { sectionId: 'section-1', side: 'back', segmentIdx: 0, x0: m2.x, z: m1.z, x1: m1.x + m1.w },
      { sectionId: 'section-1', side: 'right', segmentIdx: 1, x: m1.x + m1.w, z0: m1.z, z1: m1.z + m1.d }
    );
    if (Math.abs(m1.d - m2.d) > eps) {
      availableSides.push({ sectionId: 'section-1', side: 'front', segmentIdx: 2, x0: m1.x, z: m1.z + m1.d, x1: m1.x + m1.w });
    }
    
    availableSides.push(
      { sectionId: 'section-2', side: 'back', segmentIdx: 3, x0: m2.x, z: m2.z, x1: m2.x + m2.w },
      { sectionId: 'section-2', side: 'left', segmentIdx: 4, x: m2.x, z0: m2.z, z1: m2.z + m2.d }
    );
    if (Math.abs(m1.d - m2.d) > eps) {
      availableSides.push({ sectionId: 'section-2', side: 'front', segmentIdx: 5, x0: m2.x, z: m2.z + m2.d, x1: m2.x + m2.w });
    }
  } else if (config === 'front') {
    // m2 in front of m1, left-aligned
    availableSides.push(
      { sectionId: 'section-1', side: 'back', segmentIdx: 0, x0: m1.x, z: m1.z, x1: m1.x + m1.w },
      { sectionId: 'section-1', side: 'left', segmentIdx: 1, x: m1.x, z0: m1.z, z1: m1.z + m1.d }
    );
    if (Math.abs(m1.w - m2.w) > eps) {
      availableSides.push({ sectionId: 'section-1', side: 'right', segmentIdx: 2, x: m1.x + m1.w, z0: m1.z, z1: m1.z + m1.d });
    }
    
    availableSides.push(
      { sectionId: 'section-2', side: 'front', segmentIdx: 3, x0: m2.x, z: m2.z + m2.d, x1: m2.x + m2.w },
      { sectionId: 'section-2', side: 'left', segmentIdx: 4, x: m2.x, z0: m2.z, z1: m2.z + m2.d }
    );
    if (Math.abs(m1.w - m2.w) > eps) {
      availableSides.push({ sectionId: 'section-2', side: 'right', segmentIdx: 5, x: m2.x + m2.w, z0: m2.z, z1: m2.z + m2.d });
    }
  }
  
  return availableSides;
}

/**
 * Check if can place wall on a specific L-shape segment
 * Returns false if it would block all entry points
 */
export function canPlaceWallOnLShapeSegment(cfg, modules, segmentIdx) {
  // For now, allow placement - the entry validation happens at a higher level
  // This function can be extended if specific segment restrictions are needed
  return true;
}

/**
 * Check if can place screen on a specific L-shape segment
 */
export function canPlaceScreenOnLShapeSegment(cfg, modules, segmentIdx) {
  // Similar to walls - allow by default
  return true;
}

/**
 * Check if a side is available for L-shape placement
 */
export function isSideAvailableForLShape(cfg, sectionId, side) {
  if (cfg.layout !== 'l-shape') return true;
  
  // Check if it's an interior side
  return !isSideFullyInterior(cfg, sectionId, side);
}

/**
 * Get tooltip text for screen placement
 */
export function getScreenPlacementTooltip(cfg, modules, segmentIdx) {
  const availableSides = getLShapeAvailableSides(cfg, modules);
  const side = availableSides.find(s => s.segmentIdx === segmentIdx);
  
  if (!side) return 'Cannot place screen here';
  
  // Check if already has screen
  const hasScreen = cfg.screens?.some(s => s.segmentIdx === segmentIdx);
  if (hasScreen) return 'Click to remove screen';
  
  return 'Click to add screen';
}

/**
 * Get tooltip text for wall placement
 */
export function getWallPlacementTooltip(cfg, modules, segmentIdx) {
  const availableSides = getLShapeAvailableSides(cfg, modules);
  const side = availableSides.find(s => s.segmentIdx === segmentIdx);
  
  if (!side) return 'Cannot place wall here';
  
  // Check if already has wall
  const hasWall = cfg.walls?.some(w => w.segmentIdx === segmentIdx);
  if (hasWall) return 'Click to remove wall';
  
  // Check if can place wall (entry opening rule)
  const canPlace = canPlaceWallOnLShapeSegment(cfg, modules, segmentIdx);
  if (!canPlace) return 'Cannot place - would block all entry points';
  
  return 'Click to add wall';
}
