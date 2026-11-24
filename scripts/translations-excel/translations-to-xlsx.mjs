// Builds an .xlsx of the hakija UI translations (fi/sv) with an embedded screenshot per key.
// Usage: node translations-to-xlsx.mjs <translations.json> <translations.ts> <screenshot-dir> <out.xlsx>
// Paths are written to the sheet as given. Needs Node >= 22.18 (imports the .ts file via type stripping) and exceljs.
// Form field labels are not included: they live per avustushaku in the database.
import assert from 'node:assert'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ExcelJS from 'exceljs'

const [jsonPath, tsPath, shotDir, output] = process.argv.slice(2)
assert(output, 'usage: translations-to-xlsx.mjs <translations.json> <translations.ts> <screenshot-dir> <out.xlsx>')

const rows = []

function walkJson(node, path) {
  if (typeof node.fi === 'string' || typeof node.sv === 'string') {
    rows.push([jsonPath, path.join('.'), node.fi ?? '', node.sv ?? ''])
    return
  }
  for (const [key, child] of Object.entries(node)) walkJson(child, [...path, key])
}

const paramNames = (fn) =>
  (fn.toString().match(/^\s*(?:\(([^)]*)\)|(\w+))\s*=>/)?.slice(1).find(Boolean) ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

// Functions are rendered with {{param}} placeholders; boolean `is*` params get one row per value.
function renderFn(fiFn, svFn, key) {
  const params = paramNames(fiFn)
  if (params.length === 1 && /^is[A-Z]/.test(params[0])) {
    return [true, false].map((b) => [`${key}(${params[0]}=${b})`, fiFn(b), svFn?.(b) ?? ''])
  }
  const args = params.map((p) => `{{${p}}}`)
  return [[key, fiFn(...args), svFn?.(...args) ?? '']]
}

function walkTs(fi, sv, path) {
  for (const [key, fiValue] of Object.entries(fi)) {
    const svValue = sv?.[key]
    const keyPath = [...path, key].join('.')
    if (typeof fiValue === 'function') {
      for (const row of renderFn(fiValue, svValue, keyPath)) rows.push([tsPath, ...row])
    } else if (typeof fiValue === 'object') {
      walkTs(fiValue, svValue, [...path, key])
    } else {
      rows.push([tsPath, keyPath, fiValue, svValue ?? ''])
    }
  }
}

walkJson(JSON.parse(readFileSync(jsonPath, 'utf8')), [])
const { translations } = await import(pathToFileURL(resolve(tsPath)).href)
walkTs(translations.fi, translations.sv, [])

assert(rows.some((r) => r[0] === jsonPath && r[1] === 'form.submit'), 'translations.json not exported')
assert(rows.some((r) => r[0] === tsPath && r[1] === 'hakemus'), 'translations.ts not exported')

// Each *.json in shotDir maps key -> png file name; null means "not found on that page"
// and must not override a screenshot found by another spec.
const shots = {}
for (const f of existsSync(shotDir) ? readdirSync(shotDir) : []) {
  if (!f.endsWith('.json')) continue
  for (const [key, file] of Object.entries(JSON.parse(readFileSync(resolve(shotDir, f), 'utf8'))))
    if (file) shots[key] = file
}

const MAX_WIDTH = 900 // context screenshots are often full page width (1920px)
const MAX_HEIGHT = 520 // Excel rows max out at 409pt (~545px)

// PNG IHDR: width and height are big-endian uint32 at byte 16 and 20.
const pngSize = (buf) => ({ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) })

const workbook = new ExcelJS.Workbook()
const sheet = workbook.addWorksheet('translations', { views: [{ state: 'frozen', ySplit: 1 }] })
sheet.columns = ['source', 'key', 'fi', 'sv', 'screenshot'].map((header, i) => ({
  header,
  width: [30, 45, 60, 60, MAX_WIDTH / 7][i],
}))
sheet.getRow(1).font = { bold: true }

let embedded = 0
for (const [source, key, fi, sv] of rows) {
  const row = sheet.addRow([source, key, fi, sv])
  row.alignment = { vertical: 'top', wrapText: true }
  if (!shots[key]) continue

  const buffer = readFileSync(resolve(shotDir, shots[key]))
  // one addImage per row: exceljs links a reused image id to the wrong picture
  const imageId = workbook.addImage({ buffer, extension: 'png' })
  const { width, height } = pngSize(buffer)
  const scale = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height)
  const ext = { width: Math.round(width * scale), height: Math.round(height * scale) }

  row.height = ext.height * 0.75 + 4
  sheet.addImage(imageId, { tl: { col: 4, row: row.number - 1 }, ext, editAs: 'oneCell' })
  embedded++
}

await workbook.xlsx.writeFile(output)
console.log(`Wrote ${output}: ${rows.length} rows, ${embedded} screenshots`)
