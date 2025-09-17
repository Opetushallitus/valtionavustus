import { Answer, NormalizedHakemusData } from 'soresu-form/web/va/types'

const isPrimaryEmail = ({ key }: Answer) => key === 'primary-email'
const isOrganizationEmail = ({ key }: Answer) => key === 'organization-email'

export function initialRecipientEmails(
  answers: Answer[],
  normalizedData: NormalizedHakemusData | undefined
) {
  const normalizedVarayhteyshenkiloEmail = normalizedData?.['trusted-contact-email']
  const isVarayhteyshenkiloEmailField = (answer: Answer) =>
    !normalizedVarayhteyshenkiloEmail ? answer.key === 'trusted-contact-email' : false
  const emailsFromAnswers = answers
    .filter((a) => isPrimaryEmail(a) || isOrganizationEmail(a) || isVarayhteyshenkiloEmailField(a))
    .map((a) => a.value)
  const emails = normalizedVarayhteyshenkiloEmail
    ? [...emailsFromAnswers, normalizedVarayhteyshenkiloEmail]
    : emailsFromAnswers
  return [...new Set(emails)]
}
