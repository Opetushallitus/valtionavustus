import { Answer, Hakemus, NormalizedHakemusData } from 'soresu-form/web/va/types'

const isPrimaryEmail = ({ key }: Answer) => key === 'primary-email'
const isOrganizationEmail = ({ key }: Answer) => key === 'organization-email'

export function initialRecipientEmails(
  hakemus: Hakemus,
  normalizedData: NormalizedHakemusData | undefined
) {
  const answers = hakemus.answers
  const valiselvitysAnswersList = hakemus.selvitys?.valiselvitys?.answers || []
  const loppuselvitysAnswersList = hakemus.selvitys?.loppuselvitys?.answers || []

  const normalizedVarayhteyshenkiloEmail = normalizedData?.['trusted-contact-email']
  const isVarayhteyshenkiloEmailField = (answer: Answer) =>
    !normalizedVarayhteyshenkiloEmail ? answer.key === 'trusted-contact-email' : false

  const primaryContactEmail = normalizedData?.['contact-email']
  const isPrimaryEmailField = (answer: Answer) =>
    !primaryContactEmail ? isPrimaryEmail(answer) : false

  const emailsFromAnswers = answers
    .filter(
      (a) => isPrimaryEmailField(a) || isOrganizationEmail(a) || isVarayhteyshenkiloEmailField(a)
    )
    .map((a) => a.value)

  const valiselvitysEmails = getPrimaryOrOrganizationEmailFromAnswers(valiselvitysAnswersList)
  const loppuselvitysEmails = getPrimaryOrOrganizationEmailFromAnswers(loppuselvitysAnswersList)

  const emails = [...emailsFromAnswers, ...valiselvitysEmails, ...loppuselvitysEmails]
    .concat(primaryContactEmail ? [primaryContactEmail] : [])
    .concat(normalizedVarayhteyshenkiloEmail ? [normalizedVarayhteyshenkiloEmail] : [])

  return [...new Set(emails)]
}

function getPrimaryOrOrganizationEmailFromAnswers(answers: Answer[]) {
  return answers.filter((a) => isPrimaryEmail(a) || isOrganizationEmail(a)).map((a) => a.value)
}
