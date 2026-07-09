import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const inputDir = path.join(root, 'products', 'models')
const outputDir = path.join(root, 'products', 'models-optimized')
const cli = path.join(root, 'node_modules', 'gltf-pipeline', 'bin', 'gltf-pipeline.js')

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [command, ...args], {
      cwd: root,
      stdio: 'inherit',
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed with exit code ${code}`))
    })
  })
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const files = (await fs.readdir(inputDir)).filter((file) => file.endsWith('.glb'))
  const report = []

  for (const file of files) {
    const input = path.join(inputDir, file)
    const output = path.join(outputDir, file)
    await run(cli, ['-i', input, '-o', output])
    const [before, after] = await Promise.all([fs.stat(input), fs.stat(output)])
    report.push({
      file,
      before: before.size,
      after: after.size,
      saved: before.size - after.size,
    })
  }

  const summary = report
    .map((item) => `${item.file}: ${item.before} -> ${item.after} (${item.saved >= 0 ? '-' : '+'}${Math.abs(item.saved)} bytes)`)
    .join('\n')
  await fs.writeFile(path.join(outputDir, 'report.txt'), `${summary}\n`, 'utf8')
  console.log(summary)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
