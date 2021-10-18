import {textContent} from "../utils/util";
import {Page} from "playwright";
import {getLinkToPaatosFromEmails} from "../utils/emails";

export class HakijaPaatosPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(hakemusID: number) {
    const link = await getLinkToPaatosFromEmails(hakemusID)
    await this.page.goto(link)
  }

  async paatosHeaderTitle() {
    return await textContent(this.page, '[data-test-id="paatos-header-title"]')
  }

  async paatosTitle() {
    return await textContent(this.page, '[data-test-id="paatos-title"]')
  }

  async acceptedTitle() {
    return await textContent(this.page, '[data-test-id="paatos-accepted-title"]')
  }

  async lisatietojaTitle() {
    return await textContent(this.page, '[data-test-id="lisatietoja-title"]')
  }
}
