import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
import { pathToFileURL, fileURLToPath } from "node:url";

// Genera los tamaños web de la marca a partir de iconBase.png (fuente de diseño).
export async function generateIcons({
  source = new URL("../iconBase.png", import.meta.url),
  output = new URL("../public/icons/", import.meta.url),
} = {}) {
  await mkdir(output, { recursive: true });
  const input = sharp(await readFile(source)).resize({
    width: 1636,
    height: 1636,
    fit: "cover",
    position: "centre",
  });
  const sizes = [
    { name: "favicon-16.png", size: 16 },
    { name: "favicon-32.png", size: 32 },
    { name: "favicon-48.png", size: 48 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
  ];
  for (const { name, size } of sizes) {
    await sharp(await input.clone().png({ compressionLevel: 9 }).toBuffer())
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9, palette: true })
      .toFile(fileURLToPath(new URL(name, output)));
  }
  const iconSizes = [16, 32, 48];
  const entries = [];
  for (const size of iconSizes) {
    const png = await sharp(await input.clone().toBuffer())
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
    entries.push({ size, png });
  }
  await writeFile(new URL("favicon.ico", output), buildIco(entries));
  const icon = await sharp(await input.clone().toBuffer())
    .resize(240, 240, { fit: "cover" })
    .png()
    .toBuffer();
  const social = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#315de7"/><stop offset="100%" stop-color="#7c98f2"/></linearGradient></defs><rect width="1200" height="630" fill="#f6f8ff"/><circle cx="1080" cy="120" r="260" fill="#e7ecfd"/><circle cx="120" cy="560" r="200" fill="#eef2fe"/></svg>`,
  );
  const caption = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="200"><text x="0" y="80" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="72" font-weight="700" fill="#232733">furthurr <tspan fill="#8a91a3" font-weight="400">/</tspan> videos</text><text x="0" y="140" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" fill="#6b7080">Ideas en movimiento. Código, demos y algo más.</text></svg>`,
  );
  await sharp(social)
    .composite([
      { input: icon, left: 150, top: 195 },
      { input: caption, left: 470, top: 215 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL("og-image.png", output)));
  return sizes.map((item) => item.name).concat(["favicon.ico", "og-image.png"]);
}

// Contenedor ICO con entradas PNG comprimidas, compatible con todos los navegadores.
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const directory = Buffer.alloc(16 * entries.length);
  let offset = header.length + directory.length;
  entries.forEach((entry, index) => {
    const start = index * 16;
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, start);
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, start + 1);
    directory.writeUInt8(0, start + 2);
    directory.writeUInt8(0, start + 3);
    directory.writeUInt16LE(1, start + 4);
    directory.writeUInt16LE(32, start + 6);
    directory.writeUInt32LE(entry.png.length, start + 8);
    directory.writeUInt32LE(offset, start + 12);
    offset += entry.png.length;
  });
  return Buffer.concat([
    header,
    directory,
    ...entries.map((entry) => entry.png),
  ]);
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  const generated = await generateIcons();
  console.info(`Iconos generados: ${generated.join(", ")}`);
}
