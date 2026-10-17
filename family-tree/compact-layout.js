(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CompactTreeLayout = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // Labels sit above their circle: [-width/2, width/2] × [-height-4, -4].
  // Keep the circle in the contour too, including when a label is very small.
  const RADIUS = 4, DISTANCE = 4, MARGIN = 14;

  function layout(options) {
    const {rootId, children, box, direction = 'TB', siblingGap = 14, generationGap = 22, preferredChild, compactMainRows = false} = options || {};
    if (rootId === undefined || rootId === null) throw new TypeError('rootId is required');
    if (typeof children !== 'function' || typeof box !== 'function') throw new TypeError('children and box must be functions');
    if (direction !== 'TB' && direction !== 'LR') throw new TypeError('direction must be TB or LR');
    if (preferredChild !== undefined && typeof preferredChild !== 'function') throw new TypeError('preferredChild must be a function');
    if (typeof compactMainRows !== 'boolean') throw new TypeError('compactMainRows must be a boolean');
    for (const [key, value] of Object.entries({siblingGap, generationGap})) {
      if (!Number.isFinite(value) || value < 0) throw new TypeError(key + ' must be finite and nonnegative');
    }

    const seen = new Set(), visiting = new Set(), maxWidths = [], maxHeights = [];
    const boxes = new Map();
    function pack(id, depth) {
      if (visiting.has(id)) throw new Error('Tree cycle at ' + String(id));
      if (seen.has(id)) throw new Error('Repeated tree node ' + String(id));
      seen.add(id); visiting.add(id);
      const measured = box(id);
      if (!measured || !Number.isFinite(measured.width) || measured.width < 0 ||
          !Number.isFinite(measured.height) || measured.height < 0) {
        throw new TypeError('Invalid label box for ' + String(id));
      }
      const bounds = {width: measured.width, height: measured.height};
      boxes.set(id, bounds);
      maxWidths[depth] = Math.max(maxWidths[depth] || 0, bounds.width, RADIUS * 2);
      maxHeights[depth] = Math.max(maxHeights[depth] || 0, bounds.height);
      const childIds = children(id);
      if (!Array.isArray(childIds)) throw new TypeError('children must return an array for ' + String(id));
      const branches = [], left = [], right = [];
      for (const childId of childIds) {
        const child = pack(childId, depth + 1);
        let offset = 0;
        if (branches.length) {
          for (let level = 0; level < Math.min(right.length, child.left.length); level++) {
            offset = Math.max(offset, right[level] + siblingGap - child.left[level]);
          }
        }
        branches.push({node: child, offset});
        for (let level = 0; level < child.left.length; level++) {
          const lo = child.left[level] + offset, hi = child.right[level] + offset;
          left[level] = level < left.length ? Math.min(left[level], lo) : lo;
          right[level] = level < right.length ? Math.max(right[level], hi) : hi;
        }
      }
      const preferredId = branches.length && preferredChild ? preferredChild(id) : undefined;
      const preferred = branches.find(branch => branch.node.id === preferredId);
      const centre = preferred ? preferred.offset : branches.length ? (branches[0].offset + branches[branches.length - 1].offset) / 2 : 0;
      branches.forEach(branch => { branch.offset -= centre; });
      const ownLeft = direction === 'TB' ? -Math.max(bounds.width / 2, RADIUS) : -bounds.height - DISTANCE;
      const ownRight = direction === 'TB' ? Math.max(bounds.width / 2, RADIUS) : RADIUS;
      visiting.delete(id);
      return {id, depth, branches, preferred: preferred ? preferred.node : null, left: [ownLeft, ...left.map(value => value - centre)], right: [ownRight, ...right.map(value => value - centre)]};
    }

    const packed = pack(rootId, 0), generations = [0];
    for (let depth = 1; depth < maxHeights.length; depth++) {
      generations[depth] = generations[depth - 1] + (direction === 'TB'
        ? maxHeights[depth] + DISTANCE + generationGap
        : maxWidths[depth - 1] / 2 + maxWidths[depth] / 2 + generationGap);
    }
    const positions = new Map(), rows = new Map();
    function place(node, breadth) {
      const point = direction === 'TB' ? {x: breadth, y: generations[node.depth]} : {x: generations[node.depth], y: breadth};
      positions.set(node.id, point);
      if (!rows.has(node.depth)) rows.set(node.depth, []);
      rows.get(node.depth).push(node.id);
      node.branches.forEach(branch => place(branch.node, breadth + branch.offset));
    }
    place(packed, 0);
    if (compactMainRows) {
      const axis = direction === 'TB' ? 'x' : 'y';
      const lo = id => direction === 'TB' ? -Math.max(boxes.get(id).width / 2, RADIUS) : -boxes.get(id).height - DISTANCE;
      const hi = id => direction === 'TB' ? Math.max(boxes.get(id).width / 2, RADIUS) : RADIUS;
      // A wide descendant fan must not push its parent out of the main view.
      // Repack only rows on the preferred chain, preserving their DFS order.
      // Other rows, including all deeper descendants, keep their coordinates.
      for (let main = packed; main; main = main.preferred) {
        const row = rows.get(main.depth), pivot = row.indexOf(main.id);
        for (let i = pivot - 1; i >= 0; i--) positions.get(row[i])[axis] = positions.get(row[i + 1])[axis] + lo(row[i + 1]) - siblingGap - hi(row[i]);
        for (let i = pivot + 1; i < row.length; i++) positions.get(row[i])[axis] = positions.get(row[i - 1])[axis] + hi(row[i - 1]) + siblingGap - lo(row[i]);
      }
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [id, point] of positions) {
      const bounds = boxes.get(id), halfWidth = Math.max(bounds.width / 2, RADIUS);
      minX = Math.min(minX, point.x - halfWidth); maxX = Math.max(maxX, point.x + halfWidth);
      minY = Math.min(minY, point.y - bounds.height - DISTANCE); maxY = Math.max(maxY, point.y + RADIUS);
    }
    for (const point of positions.values()) {
      point.x += MARGIN - minX; point.y += MARGIN - minY;
    }
    return {positions, width: maxX - minX + MARGIN * 2, height: maxY - minY + MARGIN * 2};
  }
  return {layout};
});
