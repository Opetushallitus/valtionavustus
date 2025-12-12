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

  const valiselvitysContactEmail = normalizedData?.['valiselvitys-contact-email']
  const valiselvitysOrganizationEmail = normalizedData?.['valiselvitys-organization-email']
  const loppuselvitysContactEmail = normalizedData?.['loppuselvitys-contact-email']
  const loppuselvitysOrganizationEmail = normalizedData?.['loppuselvitys-organization-email']

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
    .concat(valiselvitysContactEmail ? [valiselvitysContactEmail] : [])
    .concat(valiselvitysOrganizationEmail ? [valiselvitysOrganizationEmail] : [])
    .concat(loppuselvitysContactEmail ? [loppuselvitysContactEmail] : [])
    .concat(loppuselvitysOrganizationEmail ? [loppuselvitysOrganizationEmail] : [])

  return [...new Set(emails)]
}

function getPrimaryOrOrganizationEmailFromAnswers(answers: Answer[]) {
  return answers.filter((a) => isPrimaryEmail(a) || isOrganizationEmail(a)).map((a) => a.value)
}
