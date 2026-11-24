import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import {
  clearTranslationMarks,
  fiText,
  shootTranslation,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'

const keys = [
  'muutoshakemus.title',
  'contactPersonEdit.title',
  'contactPersonEdit.contactPerson',
  'kayttoajanPidennys.checkboxTitle',
  'sisaltomuutos.checkboxTitle',
  'sendMuutoshakemus',
  'sendContactDetails',
  'originalHakemus',
]

test.setTimeout(180_000)

test('translation screenshots: hakija muutoshakemus page', async ({ page, acceptedHakemus }) => {
  const manifest: Record<string, string | null> = {}
  const muutoshakemusPage = new HakijaMuutoshakemusPage(page)
  await muutoshakemusPage.navigate(acceptedHakemus.hakemusID)

  const shootAll = async () => {
    for (const key of keys) {
      const text = fiText(key)
      if (text) manifest[key] ??= await shootTranslation(page, key, text)
    }
  }
  await shootAll()

  // sendMuutoshakemus replaces sendContactDetails only once a change is being applied for
  await muutoshakemusPage.clickHaenKayttoajanPidennysta()
  await clearTranslationMarks(page)
  await shootAll()

  for (const key of keys) manifest[key] ??= null
  writeTranslationManifest('muutoshakemus', manifest)
})
