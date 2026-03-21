import type { FlatSheet } from "@/types";

function dxfHeader(): string {
  return `0\nSECTION\n2\nHEADER\n0\nENDSEC\n`;
}

function dxfTables(): string {
  let s = `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n`;
  const layers = [
    { name: "OUTLINE", color: 7 },
    { name: "BEND_LINES", color: 1 },
    { name: "CUTOUT", color: 5 },
    { name: "SPLIT_LINE", color: 3 },
    { name: "DIMENSIONS", color: 8 },
    { name: "NOTES", color: 8 },
  ];
  for (const l of layers) {
    s += `0\nLAYER\n2\n${l.name}\n70\n0\n62\n${l.color}\n6\nCONTINUOUS\n`;
  }
  s += `0\nENDTAB\n0\nENDSEC\n`;
  return s;
}

function dxfLine(layer: string, x1: number, y1: number, x2: number, y2: number): string {
  return `0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${y1}\n30\n0\n11\n${x2}\n21\n${y2}\n31\n0\n`;
}

function dxfRect(layer: string, x: number, y: number, w: number, h: number): string {
  return (
    dxfLine(layer, x, y, x + w, y) +
    dxfLine(layer, x + w, y, x + w, y + h) +
    dxfLine(layer, x + w, y + h, x, y + h) +
    dxfLine(layer, x, y + h, x, y)
  );
}

function dxfText(layer: string, x: number, y: number, height: number, text: string): string {
  return `0\nTEXT\n8\n${layer}\n10\n${x}\n20\n${y}\n30\n0\n40\n${height}\n1\n${text}\n`;
}

export function generateDxf(flatSheet: FlatSheet, finishName: string): string {
  let entities = `0\nSECTION\n2\nENTITIES\n`;

  // Segments
  for (const seg of flatSheet.segments) {
    entities += dxfRect("OUTLINE", seg.x, seg.y, seg.width, seg.height);
    entities += dxfText("DIMENSIONS", seg.x + seg.width / 2, seg.y + seg.height / 2, 8, `${seg.label} ${seg.width}x${seg.height}`);
  }

  // Bend lines
  for (const bend of flatSheet.bendLines) {
    entities += dxfLine("BEND_LINES", bend.startX, bend.startY, bend.endX, bend.endY);
  }

  // Split line
  if (flatSheet.requiresSplit && flatSheet.splitPosition !== null) {
    if (flatSheet.splitDirection === "vertical") {
      entities += dxfLine("SPLIT_LINE", flatSheet.splitPosition, 0, flatSheet.splitPosition, flatSheet.totalHeight);
    } else {
      entities += dxfLine("SPLIT_LINE", 0, flatSheet.splitPosition, flatSheet.totalWidth, flatSheet.splitPosition);
    }
  }

  // Note
  entities += dxfText("NOTES", 0, -20, 6, `5mm bend allowance per fold applied | ${finishName} | ${flatSheet.thickness}mm gauge`);

  entities += `0\nENDSEC\n`;

  return dxfHeader() + dxfTables() + entities + `0\nEOF\n`;
}

export function downloadDxf(flatSheet: FlatSheet, finishName: string, width: number, depth: number) {
  const dxf = generateDxf(flatSheet, finishName);
  const blob = new Blob([dxf], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `HT-${finishName}-${width}x${depth}-flat.dxf`;
  a.click();
  URL.revokeObjectURL(url);
}
