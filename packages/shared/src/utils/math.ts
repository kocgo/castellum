import { Vector2 } from '../types/entities';

export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

export function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function multiply(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Circle-Circle collision
export function circlesCollide(
  pos1: Vector2,
  radius1: number,
  pos2: Vector2,
  radius2: number
): boolean {
  const dist = distance(pos1, pos2);
  return dist < radius1 + radius2;
}

// Circle-Rectangle collision
export function circleRectCollide(
  circlePos: Vector2,
  circleRadius: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  // Find closest point on rectangle to circle center
  const closestX = clamp(circlePos.x, rectX, rectX + rectWidth);
  const closestY = clamp(circlePos.y, rectY, rectY + rectHeight);

  // Calculate distance from circle center to closest point
  const dx = circlePos.x - closestX;
  const dy = circlePos.y - closestY;

  return dx * dx + dy * dy < circleRadius * circleRadius;
}

// Point in rectangle
export function pointInRect(
  point: Vector2,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  return (
    point.x >= rectX &&
    point.x <= rectX + rectWidth &&
    point.y >= rectY &&
    point.y <= rectY + rectHeight
  );
}

// Random number between min and max (inclusive)
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float between min and max
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
