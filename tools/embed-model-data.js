import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const models = [
  "products/models/nc2528rl1-jar.glb",
  "products/models/nc2623t3-jar.glb",
  "products/models/nc3380rl1-jar.glb",
  "products/models/nc3380rl1-front.glb",
  "products/models/nc3880rl1-jar.glb",
  "products/models/nc5280rl1-jar.glb",
  "products/models/nc5280rl1-front.glb",
  "products/models/nc5280rl1-side.glb",
  "products/models/smt-red-adhesive-label.glb",
  "products/models/smt-red-adhesive-syringe.glb"
];

const payload = {};
for (const model of models) {
  const buffer = fs.readFileSync(path.join(root, model));
  payload[model] = `data:model/gltf-binary;base64,${buffer.toString("base64")}`;
}

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(
  path.join(root, "dist", "model-data.js"),
  `window.PRODUCT_MODEL_URIS = ${JSON.stringify(payload)};\n`,
  "utf8"
);
console.log("Built dist/model-data.js");
