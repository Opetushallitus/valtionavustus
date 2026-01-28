import { expect } from '@playwright/test'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { waitUntilMinEmails, getAcceptedPäätösEmails } from '../../utils/emails'

/**
 * Test that emails are sent to both:
 * 1. The contact email stored on the application (erkki.esimerkki@example.com)
 * 2. The organization email fetched from organisaatiopalvelu (hakija-1424884@oph.fi for Y-tunnus 2050864-5)
 *
 * The default test Y-tunnus is 2050864-5 (Akaan kaupunki) which has email hakija-1424884@oph.fi
 * in the organisaatiopalvelu mock.
 */
muutoshakemusTest(
  'Decision email is sent to both contact email and organization service email',
  async ({ acceptedHakemus, answers }) => {
    const hakemusID = acceptedHakemus.hakemusID

    // Wait for päätös email to be sent
    const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)

    // Verify at least one email was sent
    expect(emails).toHaveLength(1)

    // Get the recipients from the first email
    const recipients = emails[0]['to-address']

    // The contact email from the application should be in the recipients
    expect(recipients).toContain(answers.contactPersonEmail)

    // The organization email from organisaatiopalvelu should also be in the recipients
    // For Y-tunnus 2050864-5 (Akaan kaupunki), the organization email is hakija-1424884@oph.fi
    expect(recipients).toContain('hakija-1424884@oph.fi')
  }
)
