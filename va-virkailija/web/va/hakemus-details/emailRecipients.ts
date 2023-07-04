import { Answer, NormalizedHakemusData } from 'soresu-form/web/va/types'

const isPrimaryEmail = ({ key }: Answer) => key === 'primary-email'
const isOrganizationEmail = ({ key }: Answer) => key === 'organization-email'

export function initialRecipientEmails(
  answers: Answer[],
  normalizedData: NormalizedHakemusData | undefined,
  varayhteyshenkiloEnabled = false
) {
  const normalizedVarayhteyshenkiloEmail = normalizedData?.['trusted-contact-email']
  const isVarayhteyshenkiloEmailField = (answer: Answer) =>
    varayhteyshenkiloEnabled && !normalizedVarayhteyshenkiloEmail
      ? answer.key === 'trusted-contact-email'
      : false
  const emailsFromAnswers = answers
    .filter((a) => isPrimaryEmail(a) || isOrganizationEmail(a) || isVarayhteyshenkiloEmailField(a))
    .map((a) => a.value)
  if (normalizedVarayhteyshenkiloEmail) {
    return [...emailsFromAnswers, normalizedVarayhteyshenkiloEmail]
  }
  return emailsFromAnswers
}
