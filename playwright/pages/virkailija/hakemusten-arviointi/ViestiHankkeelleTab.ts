import { expect, test, Page } from '@playwright/test'

export type ViestiHankkeelleTab = ReturnType<typeof createViestiHankkeelleTab>

export function createViestiHankkeelleTab(page: Page) {
  const sendMessageForm = {
    recipients: {
      addressInputs: page.getByRole('group', { name: 'Vastaanottajat' }).getByRole('textbox'),
      addButton: page.getByRole('button', { name: 'Lisää uusi vastaanottaja' }),
    },
    subject: page.getByRole('textbox', { name: 'Aihe' }),
    body: page.getByRole('textbox', { name: 'Sisältö' }),
    sendButton: page.getByRole('button', { name: 'Lähetä viesti' }),
  }

  const locators = {
    sendMessageForm,
  }

  async function getRecipients(): Promise<string[]> {
    const recipientInputs = await sendMessageForm.recipients.addressInputs.all()
    const values = recipientInputs.map((input) => input.inputValue())
    return Promise.all(values)
  }

  async function expectFormIsClear(): Promise<void> {
    const { subject, body } = locators.sendMessageForm
    await expect.soft(subject).toBeEmpty()
    await expect.soft(body).toBeEmpty()

    expect(test.info().errors, 'Email form should be clear').toHaveLength(0)
  }

  return { locators, expectFormIsClear, getRecipients }
}
