import createQrCode from 'qrcode-generator';

/** A QR code as inline SVG (one path, crisp module edges), for embedding in the PDF HTML. */
export function qrSvg(text: string, size: number, color = '#111827'): string {
  const qr = createQrCode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  let d = '';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
    }
  }
  const quiet = 3;
  const box = count + quiet * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-quiet} ${-quiet} ${box} ${box}" shape-rendering="crispEdges"><rect x="${-quiet}" y="${-quiet}" width="${box}" height="${box}" fill="#ffffff"/><path d="${d}" fill="${color}"/></svg>`;
}
