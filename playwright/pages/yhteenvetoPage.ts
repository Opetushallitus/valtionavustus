import { Locator, Page } from '@playwright/test'

import { navigate } from '../utils/navigate'

const tdTextForLocator = (parentLocator: Locator, nthOfType: number) =>
  parentLocator.locator(`td:nth-of-type(${nthOfType})`).textContent()

type SummaryStatus = 'accepted' | 'combined'

export class YhteenvetoPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async navigate(url: string) {
    await navigate(this.page, url)
  }

  title() {
    return this.page.textContent('h1')
  }

  async summaryHeadingRowFor(status: SummaryStatus) {
    const row = this.page.locator(`[data-test-id=summary-for-${status}]`)
    return {
      title: await tdTextForLocator(row, 1),
      amount: await tdTextForLocator(row, 2),
      appliedAmount: await tdTextForLocator(row, 3),
      grantedAmount: await tdTextForLocator(row, 4),
    }
  }

  tableFor(status: SummaryStatus) {
    return this.page.locator(`[data-test-id=${status}-table]`)
  }

  async summaryTableHeadingFor(status: SummaryStatus) {
    return this.page.locator(`[data-test-id=${status}-table-heading]`).textContent()
  }

  async summaryTableRowForHakemus(status: SummaryStatus, hakemusId: number) {
    const row = this.tableFor(status).locator(`#hakemus-${hakemusId}`)
    return {
      organization: await tdTextForLocator(row, 1),
      project: await tdTextForLocator(row, 2),
      appliedAmount: await tdTextForLocator(row, 3),
      grantedAmount: await tdTextForLocator(row, 4),
      comment: await tdTextForLocator(row, 5),
    }
  }

  async summaryTableSummaryRow(status: SummaryStatus) {
    const summaryRow = this.tableFor(status).locator('tfoot')
    return {
      totalAppliedAmount: await tdTextForLocator(summaryRow, 2),
      totalGrantedAmount: await tdTextForLocator(summaryRow, 3),
    }
  }
}
