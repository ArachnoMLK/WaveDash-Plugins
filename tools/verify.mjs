#!/usr/bin/env node
// Checks the catalog: each package exists, its hash and size match index.json,
// and its decompressed content is identical to the sources in plugins/ (manifest and script). No package edited by hand.
import { createHash, createPublicKey, verify } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const fail = (m) => { console.error('✗ ' + m); process.exitCode = 1 }
function unzip(buf) {                                   // archives produced by tools/wdsh-pack.mjs (local headers with sizes)
  const files = {}
  for (let o = 0; buf.readUInt32LE(o) === 0x04034b50;) {
    const method = buf.readUInt16LE(o + 8), csize = buf.readUInt32LE(o + 18), nlen = buf.readUInt16LE(o + 26), xlen = buf.readUInt16LE(o + 28)
    const name = buf.toString('utf8', o + 30, o + 30 + nlen), data = buf.subarray(o + 30 + nlen + xlen, o + 30 + nlen + xlen + csize)
    files[name] = method === 8 ? inflateRawSync(data) : data
    o += 30 + nlen + xlen + csize
  }
  return files
}
const indexBuf = readFileSync(join(root, 'index.json'))
let signed = false
try { signed = verify(null, indexBuf, createPublicKey(readFileSync(join(root, 'catalog-public.pem'))), Buffer.from(readFileSync(join(root, 'index.json.sig'), 'utf8').trim(), 'base64')) } catch { signed = false }
if (!signed) fail('index.json: missing or invalid signature (run node tools/build.mjs with the private key)')
const index = JSON.parse(indexBuf.toString('utf8'))
const sources = {}
for (const dir of readdirSync(join(root, 'plugins'))) {
  const src = join(root, 'plugins', dir); if (!statSync(src).isDirectory()) continue
  const m = JSON.parse(readFileSync(join(src, 'manifest.json'), 'utf8')); sources[m.id] = { src, m }
}
for (const p of index.plugins) {
  const s = sources[p.id]
  if (!s) { fail(`${p.id}: no sources in plugins/`); continue }
  if (s.m.version !== p.version) fail(`${p.id}: version ${p.version} in the index, ${s.m.version} in the sources`)
  let buf; try { buf = readFileSync(join(root, p.file)) } catch { fail(`${p.id} : paquet ${p.file} absent`); continue }
  if (buf.length !== p.size || createHash('sha256').update(buf).digest('hex') !== p.sha256) fail(`${p.id}: hash or size differs from the index`)
  const files = unzip(buf), entry = s.m.entry ?? 'main.js'
  for (const f of ['manifest.json', entry]) if (!files[f] || !files[f].equals(readFileSync(join(s.src, f)))) fail(`${p.id}: ${f} in the package differs from the sources`)
}
for (const id of Object.keys(sources)) if (!index.plugins.some((p) => p.id === id)) fail(`${id} : absent d'index.json (lance node tools/build.mjs)`)
if (!process.exitCode) console.log(`✓ ${index.plugins.length} plugins verified`)
