import { Page } from "@playwright/test";

const agreeText = 'Ymmärrän, että avustus evätään, kun olen lähettänyt ilmoituksen'
const submittedText = 'Ilmoitus avustuksen vastaanottamatta jättämisestä lähetetty hakijan toimesta'

export function RefusePage(page: Page) {
  const locators = {
    refuseComment: page.locator('.refuse-comment textarea'),
    agreeCheckbox: page.locator(`label:has-text("${agreeText}") input`),
    agreeButton: page.locator('button:has-text("Lähetä ilmoitus")'),
    submittedNotice: page.locator(`text=${submittedText}`)
  }

  const defaultComment = 'Tilille ei mahdu enempää pätäkkää'
  async function refuseGrant(comment = defaultComment) {
    await locators.refuseComment.type(comment)
    await locators.agreeCheckbox.check()
    await locators.agreeButton.click({ timeout: 2000 })
    await locators.submittedNotice.waitFor()
  }

  return {
    locators,
    refuseGrant,
  }
}
