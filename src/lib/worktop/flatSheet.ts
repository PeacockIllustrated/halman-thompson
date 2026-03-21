import type { WorktopConfig, FlatSheet, FlatSegment, BendLine } from "@/types";

const BEND_ALLOWANCE_MM = 5; // 2.5mm each side of bend for stretch
const MAX_SHEET_WIDTH = 2000;
const MAX_SHEET_HEIGHT = 1000;

export function calculateFlatSheet(
  width: number,
  depth: number,
  thickness: number,
  config: WorktopConfig
): FlatSheet {
  const segments: FlatSegment[] = [];
  const bendLines: BendLine[] = [];

  // Determine which edges are active
  const hasLeft = config.leftReturn.enabled;
  const hasRight = config.rightReturn.enabled;
  const hasFront = config.frontReturn.enabled;
  const hasBack = config.backUpstand.enabled || config.backReturn.enabled;

  const leftDepth = hasLeft ? config.leftReturn.depth : 0;
  const rightDepth = hasRight ? config.rightReturn.depth : 0;
  const frontDepth = hasFront ? config.frontReturn.depth : 0;
  const backDepth = config.backUpstand.enabled
    ? config.backUpstand.depth
    : config.backReturn.enabled
      ? config.backReturn.depth
      : 0;

  // Count bends
  const bendCountWidth = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);
  const bendCountHeight = (hasFront ? 1 : 0) + (hasBack ? 1 : 0);
  const bendCount = bendCountWidth + bendCountHeight;
  const totalBendDeduction = bendCount * BEND_ALLOWANCE_MM;

  // Total flat dimensions
  const totalWidth =
    leftDepth + width + rightDepth - bendCountWidth * BEND_ALLOWANCE_MM;
  const totalHeight =
    frontDepth + depth + backDepth - bendCountHeight * BEND_ALLOWANCE_MM;

  // ── Segment positions ──
  // Main surface origin (top-left corner on the flat sheet)
  const mainX = leftDepth;
  const mainY = backDepth; // back is at top of flat sheet

  // Main surface
  segments.push({
    id: "main-surface",
    label: "Main Surface",
    x: mainX,
    y: mainY,
    width,
    height: depth,
  });

  // Front return (below main surface, same width)
  if (hasFront) {
    segments.push({
      id: "front-return",
      label: "Front Return",
      x: mainX,
      y: mainY + depth,
      width,
      height: frontDepth,
    });
  }

  // Back upstand or return (above main surface, same width)
  if (hasBack) {
    const label = config.backUpstand.enabled ? "Back Upstand" : "Back Return";
    segments.push({
      id: config.backUpstand.enabled ? "back-upstand" : "back-return",
      label,
      x: mainX,
      y: 0,
      width,
      height: backDepth,
    });
  }

  // Left return (left of main surface, spans main depth only)
  if (hasLeft) {
    segments.push({
      id: "left-return",
      label: "Left Return",
      x: 0,
      y: mainY,
      width: leftDepth,
      height: depth,
    });
  }

  // Right return (right of main surface, spans main depth only)
  if (hasRight) {
    segments.push({
      id: "right-return",
      label: "Right Return",
      x: mainX + width,
      y: mainY,
      width: rightDepth,
      height: depth,
    });
  }

  // ── Bend lines ──
  if (hasFront) {
    bendLines.push({
      id: "front-return",
      startX: mainX,
      startY: mainY + depth,
      endX: mainX + width,
      endY: mainY + depth,
      direction: "down",
      label: "Front Return Fold",
    });
  }

  if (hasBack) {
    bendLines.push({
      id: config.backUpstand.enabled ? "back-upstand" : "back-return",
      startX: mainX,
      startY: mainY,
      endX: mainX + width,
      endY: mainY,
      direction: config.backUpstand.enabled ? "up" : "down",
      label: config.backUpstand.enabled
        ? "Back Upstand Fold"
        : "Back Return Fold",
    });
  }

  if (hasLeft) {
    bendLines.push({
      id: "left-return",
      startX: mainX,
      startY: mainY,
      endX: mainX,
      endY: mainY + depth,
      direction: "down",
      label: "Left Return Fold",
    });
  }

  if (hasRight) {
    bendLines.push({
      id: "right-return",
      startX: mainX + width,
      startY: mainY,
      endX: mainX + width,
      endY: mainY + depth,
      direction: "down",
      label: "Right Return Fold",
    });
  }

  // ── Split detection ──
  let requiresSplit = false;
  let splitDirection: "horizontal" | "vertical" | null =
    config.splitDirection ?? null;
  let splitPosition: number | null = config.splitPosition ?? null;

  if (totalWidth > MAX_SHEET_WIDTH || totalHeight > MAX_SHEET_HEIGHT) {
    requiresSplit = true;
    if (!splitDirection) {
      splitDirection =
        totalWidth > MAX_SHEET_WIDTH ? "vertical" : "horizontal";
    }
    if (splitPosition === null) {
      splitPosition =
        splitDirection === "vertical"
          ? Math.round(totalWidth / 2)
          : Math.round(totalHeight / 2);
    }
  }

  return {
    totalWidth,
    totalHeight,
    thickness,
    segments,
    bendLines,
    requiresSplit,
    splitPosition,
    splitDirection,
    bendAllowanceMm: BEND_ALLOWANCE_MM,
    bendCount,
    totalBendDeduction,
  };
}
