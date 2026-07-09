import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

esbuild.buildSync({
  entryPoints: {
    app: path.join(root, "src", "r3f-app.jsx"),
    vendor: path.join(root, "src", "r3f-vendor.js"),
  },
  bundle: true,
  format: "esm",
  splitting: true,
  target: "es2020",
  platform: "browser",
  minify: true,
  outdir: "dist/r3f",
  entryNames: "[name]",
  chunkNames: "chunks/[name]-[hash]",
  absWorkingDir: root,
  nodePaths: [path.join(root, "node_modules")],
  define: {
    "process.env.NODE_ENV": '"production"'
  }
});

console.log("Built dist/r3f/app.js");
