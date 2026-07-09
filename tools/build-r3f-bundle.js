import esbuild from "esbuild";

esbuild.buildSync({
  entryPoints: {
    app: "./src/r3f-app.jsx",
    vendor: "./src/r3f-vendor.js",
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
  absWorkingDir: process.cwd(),
  nodePaths: ["node_modules"],
  define: {
    "process.env.NODE_ENV": '"production"'
  }
});

console.log("Built dist/r3f/app.js");
