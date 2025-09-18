import { Answer, NormalizedHakemusData } from 'soresu-form/web/va/types'

const isPrimaryEmail = ({ key }: Answer) => key === 'primary-email'
const isOrganizationEmail = ({ key }: Answer) => key === 'organization-email'

export function initialRecipientEmails(
  answers: Answer[],
  normalizedData: NormalizedHakemusData | undefined,
  valiselvitysAnswers?: Answer[]
) {
  const normalizedVarayhteyshenkiloEmail = normalizedData?.['trusted-contact-email']
  const isVarayhteyshenkiloEmailField = (answer: Answer) =>
    !normalizedVarayhteyshenkiloEmail ? answer.key === 'trusted-contact-email' : false
  const emailsFromAnswers = answers
    .filter((a) => isPrimaryEmail(a) || isOrganizationEmail(a) || isVarayhteyshenkiloEmailField(a))
    .map((a) => a.value)

  const valiselvitysEmails = getPrimaryOrOrganizationEmailFromAnswers(valiselvitysAnswers || [])
  const emails = [...emailsFromAnswers, ...valiselvitysEmails].concat(
    normalizedVarayhteyshenkiloEmail ? [normalizedVarayhteyshenkiloEmail] : []
  )

  return [...new Set(emails)]
}

function getPrimaryOrOrganizationEmailFromAnswers(answers: Answer[]) {
  return answers.filter((a) => isPrimaryEmail(a) || isOrganizationEmail(a)).map((a) => a.value)
}
