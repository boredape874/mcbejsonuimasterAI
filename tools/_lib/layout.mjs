// tools/_lib/layout.mjs
// Anchor math: convert (anchor, pos) → absolute rect, and back.

const X_MODE = {
  top_left: "left", top_middle: "centerX", top_right: "right",
  left_middle: "left", center: "centerX", right_middle: "right",
  bottom_left: "left", bottom_middle: "centerX", bottom_right: "right",
};
const Y_MODE = {
  top_left: "top", top_middle: "top", top_right: "top",
  left_middle: "centerY", center: "centerY", right_middle: "centerY",
  bottom_left: "bottom", bottom_middle: "bottom", bottom_right: "bottom",
};

export function anchorXMode(a) { return X_MODE[a]; }
export function anchorYMode(a) { return Y_MODE[a]; }

export function placeFrom(parentRect, anchor, pos, size) {
  const xm = X_MODE[anchor], ym = Y_MODE[anchor];
  const [w, h] = size;
  let x;
  if (xm === "left") x = parentRect.x + pos[0];
  else if (xm === "right") x = parentRect.x + parentRect.w + pos[0] - w;
  else x = parentRect.x + parentRect.w / 2 + pos[0] - w / 2;
  let y;
  if (ym === "top") y = parentRect.y + pos[1];
  else if (ym === "bottom") y = parentRect.y + parentRect.h + pos[1] - h;
  else y = parentRect.y + parentRect.h / 2 + pos[1] - h / 2;
  return { x: Math.round(x), y: Math.round(y), w, h };
}

export function offsetFrom(parentRect, anchor, rect) {
  const xm = X_MODE[anchor], ym = Y_MODE[anchor];
  let ox;
  if (xm === "left") ox = rect.x - parentRect.x;
  else if (xm === "right") ox = (rect.x + rect.w) - (parentRect.x + parentRect.w);
  else ox = (rect.x + rect.w / 2) - (parentRect.x + parentRect.w / 2);
  let oy;
  if (ym === "top") oy = rect.y - parentRect.y;
  else if (ym === "bottom") oy = (rect.y + rect.h) - (parentRect.y + parentRect.h);
  else oy = (rect.y + rect.h / 2) - (parentRect.y + parentRect.h / 2);
  return [Math.round(ox), Math.round(oy)];
}

export function edgeValue(rect, edge) {
  switch (edge) {
    case "left": return rect.x;
    case "right": return rect.x + rect.w;
    case "top": return rect.y;
    case "bottom": return rect.y + rect.h;
    case "center_x": return rect.x + rect.w / 2;
    case "center_y": return rect.y + rect.h / 2;
    default: throw new Error(`unknown edge ${edge}`);
  }
}

export function setEdge(rect, edge, value) {
  switch (edge) {
    case "left": rect.x = value; return;
    case "right": rect.x = value - rect.w; return;
    case "top": rect.y = value; return;
    case "bottom": rect.y = value - rect.h; return;
    case "center_x": rect.x = value - rect.w / 2; return;
    case "center_y": rect.y = value - rect.h / 2; return;
    default: throw new Error(`unknown edge ${edge}`);
  }
}
