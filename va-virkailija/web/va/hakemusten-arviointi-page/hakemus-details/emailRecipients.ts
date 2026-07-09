import { Answer, Hakemus, NormalizedHakemusData } from 'soresu-form/web/va/types'

const isPrimaryEmail = ({ key }: Answer) => key === 'primary-email'

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
  const loppuselvitysContactEmail = normalizedData?.['loppuselvitys-contact-email']

  const emailsFromAnswers = answers
    .filter((a) => isPrimaryEmailField(a) || isVarayhteyshenkiloEmailField(a))
    .map((a) => a.value)

  const valiselvitysEmails = getPrimaryEmailFromAnswers(valiselvitysAnswersList)
  const loppuselvitysEmails = getPrimaryEmailFromAnswers(loppuselvitysAnswersList)

  const emails = [...emailsFromAnswers, ...valiselvitysEmails, ...loppuselvitysEmails]
    .concat(primaryContactEmail ? [primaryContactEmail] : [])
    .concat(normalizedVarayhteyshenkiloEmail ? [normalizedVarayhteyshenkiloEmail] : [])
    .concat(valiselvitysContactEmail ? [valiselvitysContactEmail] : [])
    .concat(loppuselvitysContactEmail ? [loppuselvitysContactEmail] : [])

  return [...new Set(emails)]
}

function getPrimaryEmailFromAnswers(answers: Answer[]) {
  return answers.filter(isPrimaryEmail).map((a) => a.value)
}
