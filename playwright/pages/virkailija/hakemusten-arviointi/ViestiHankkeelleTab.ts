import { expect, test, Page, Locator } from '@playwright/test'

export type ViestiHankkeelleTab = ReturnType<typeof createViestiHankkeelleTab>

export function createViestiHankkeelleTab(page: Page) {
  const messageListRegion = page.getByRole('list', { name: 'Aiemmin lähetetyt viestit' })
  const messageList = {
    region: messageListRegion,
    messageRows: messageListRegion.getByRole('listitem'),
    messageRow: {
      subject: (messageRowLocator: Locator): Locator =>
        messageRowLocator.getByRole('row', { name: 'Aihe' }).getByRole('cell'),
      recipients: (messageRowLocator: Locator): Locator =>
        messageRowLocator.getByRole('row', { name: 'Vastaanottajat' }).getByRole('cell'),
    },
  }

  const sendMessageRegion = page.getByRole('region', { name: 'Lähetä viesti hankkeelle' })
  const sendMessageForm = {
    region: sendMessageRegion,
    recipients: {
      addressInputs: sendMessageRegion
        .getByRole('group', { name: 'Vastaanottajat' })
        .getByRole('textbox'),
      addButton: sendMessageRegion.getByRole('button', { name: 'Lisää uusi vastaanottaja' }),
    },
    subject: sendMessageRegion.getByRole('textbox', { name: 'Aihe' }),
    body: sendMessageRegion.getByRole('textbox', { name: 'Sisältö' }),
    previewButton: sendMessageRegion.getByRole('button', { name: 'Esikatsele' }),
    sendButton: sendMessageRegion.getByRole('button', { name: 'Lähetä viesti' }),
  }

  const locators = {
    sendMessageForm,
    messageList,
  }

  async function expectFormIsClear(defaultSubject?: string): Promise<void> {
    const { subject, body } = locators.sendMessageForm
    if (defaultSubject) {
      await expect.soft(subject).toHaveValue(defaultSubject)
    } else {
      await expect.soft(subject).toBeEmpty()
    }
    await expect.soft(body).toBeEmpty()

    expect(test.info().errors, 'Email form should be clear').toHaveLength(0)
  }

  return { locators, expectFormIsClear }
}
