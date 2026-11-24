import { Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
// shortcut: imports from outside playwright/, Dockerfile.playwright-test-runner must COPY these before this runs in CI
import translationsJson from '../../server/resources/public/translations.json'
import { translationsFi } from '../../soresu-form/web/va/i18n/translations'

export const translationScreenshotDir = path.resolve(
  __dirname,
  '../../playwright-results/translation-screenshots'
)

/**
 * Finnish text for a CSV key (translations.json or translations.ts, they share no top-level keys).
 * `{{placeholder}}` strings are reduced to their longest static part. Function values return null.
 */
export function fiText(key: string): string | null {
  const parts = key.split('.')
  const json = parts.reduce<any>((o, p) => o?.[p], translationsJson)
  const value =
    typeof json?.fi === 'string' ? json.fi : parts.reduce<any>((o, p) => o?.[p], translationsFi)
  if (typeof value !== 'string') return null
  // longest static part, so texts starting with a placeholder ("{{formtype}} jättämisen…") still match
  return value
    .split(/{{.*?}}/)
    .map((s) => s.trim())
    .reduce((a, b) => (b.length > a.length ? b : a), '')
}

const MAX_CONTEXT_HEIGHT = 450
const HIGHLIGHT = '3px solid red'

/**
 * Screenshots the context around the visible element showing `text`, with that element outlined.
 * Several keys rendered in the same element share one file. Returns the file name, or null if not shown.
 */
export async function shootTranslation(page: Page, key: string, text: string) {
  // exact first so short strings like "Hakemus" don't hit every label containing the word;
  // then case-sensitive substring for interpolated text like "Tallennettu 23.11.2026"
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const match of [text, new RegExp(escaped)]) {
    for (const el of await page.getByText(match, { exact: true }).all()) {
      if (!(await el.isVisible())) continue
      const file = `${key}.png`
      const existing = await el.evaluate((e, f) => {
        const prev = e.dataset.trShot
        e.dataset.trShot ??= f
        return prev
      }, file)
      if (existing) return existing

      const clip = await el.evaluate(
        (e, { maxHeight, highlight }) => {
          e.scrollIntoView({ block: 'center' })
          e.style.outline = highlight
          e.style.outlineOffset = '2px'
          // union of the whole chain, so popups overflowing their parent (e.g. error summary) are not cut off
          let [top, left, bottom, right] = [Infinity, Infinity, -Infinity, -Infinity]
          for (let n: Element | null = e; n && n !== document.body; n = n.parentElement) {
            const r = n.getBoundingClientRect()
            if (r.height > maxHeight) break
            top = Math.min(top, r.top)
            left = Math.min(left, r.left)
            bottom = Math.max(bottom, r.bottom)
            right = Math.max(right, r.right)
          }
          const pad = 8
          if (top !== Infinity) {
            return {
              x: left - pad,
              y: top - pad,
              width: right - left + 2 * pad,
              height: bottom - top + 2 * pad,
            }
          }
          // even the element is too tall (e.g. a stretched flex item): take a band around its text
          const range = document.createRange()
          range.selectNodeContents(e)
          const t = range.getBoundingClientRect()
          const r = e.getBoundingClientRect()
          return {
            x: r.x - pad,
            y: t.y + t.height / 2 - maxHeight / 2,
            width: r.width + 2 * pad,
            height: maxHeight,
          }
        },
        { maxHeight: MAX_CONTEXT_HEIGHT, highlight: HIGHLIGHT }
      )
      const viewport = page.viewportSize()!
      const x = Math.max(0, clip.x)
      const y = Math.max(0, clip.y)
      await page.screenshot({
        path: path.join(translationScreenshotDir, file),
        clip: {
          x,
          y,
          width: Math.min(clip.width, viewport.width - x),
          height: Math.min(clip.height, viewport.height - y),
        },
      })
      await el.evaluate((e) => {
        e.style.outline = ''
        e.style.outlineOffset = ''
      })
      return file
    }
  }
  return null
}

/** React may reuse a node with new text; drop marks so the next pass shoots it again. */
export async function clearTranslationMarks(page: Page) {
  await page.evaluate(() =>
    document.querySelectorAll<HTMLElement>('[data-tr-shot]').forEach((e) => delete e.dataset.trShot)
  )
}

export function writeTranslationManifest(name: string, manifest: Record<string, string | null>) {
  fs.mkdirSync(translationScreenshotDir, { recursive: true })
  fs.writeFileSync(
    path.join(translationScreenshotDir, `${name}.json`),
    JSON.stringify(manifest, null, 2)
  )
}
