#!/usr/bin/env node
// Packs each plugin of plugins/ into packages/<id>-<version>.wdsh and writes index.json (catalog read by WaveDash).
// Usage: node tools/build.mjs        (run before every commit that changes a plugin)
import { createHash, createPrivateKey, sign } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const out = join(root, 'packages')
rmSync(out, { recursive: true, force: true }); mkdirSync(out)
const plugins = []
for (const dir of readdirSync(join(root, 'plugins')).sort()) {
  const src = join(root, 'plugins', dir)
  if (!statSync(src).isDirectory()) continue
  const m = JSON.parse(readFileSync(join(src, 'manifest.json'), 'utf8'))
  const file = `packages/${m.id}-${m.version}.wdsh`
  execFileSync(process.execPath, [join(root, 'tools', 'wdsh-pack.mjs'), src, join(root, file)], { stdio: 'ignore' })
  const buf = readFileSync(join(root, file))
  plugins.push({ id: m.id, name: m.name, version: m.version, author: m.author ?? '', description: m.description ?? '',
    minAppVersion: m.minAppVersion, permissions: m.permissions ?? {}, file, size: buf.length, sha256: createHash('sha256').update(buf).digest('hex') })
}
const index = Buffer.from(JSON.stringify({ format: 1, plugins }, null, 2) + '\n')
writeFileSync(join(root, 'index.json'), index)
// Ed25519 signature of index.json: WaveDash rejects an index not signed with this key. The private key is NEVER in the repository:
// by default ../wavedash-catalog-private.pem (next to the repository folder), or the path given by WAVEDASH_CATALOG_KEY.
const keyPath = process.env.WAVEDASH_CATALOG_KEY || join(root, '..', 'wavedash-catalog-private.pem')
let key
try { key = createPrivateKey(readFileSync(keyPath)) } catch { console.error(`Private key not found (${keyPath}): index.json not signed.`); process.exit(1) }
writeFileSync(join(root, 'index.json.sig'), sign(null, index, key).toString('base64') + '\n')
console.log(`${plugins.length} plugins → index.json (signed)`)
