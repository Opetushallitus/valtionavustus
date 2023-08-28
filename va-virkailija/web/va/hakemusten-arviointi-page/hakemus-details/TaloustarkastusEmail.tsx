import React, { useState } from 'react'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { UserInfo } from '../../types'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { Hakemus, Selvitys, SelvitysEmail } from 'soresu-form/web/va/types'

import { VerificationBox } from './VerificationBox'
import { useHakemustenArviointiDispatch } from '../arviointiStore'
import { loadSelvitys, refreshHakemukset } from '../arviointiReducer'
import { initialRecipientEmails } from './emailRecipients'
import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'

type TaloustarkastusEmailProps = {
  avustushakuId: number
  hakemus: Hakemus
  loppuselvitys: Selvitys
  userInfo: UserInfo
  avustushakuName: string
}

export const TaloustarkastusEmail = ({
  hakemus,
  loppuselvitys,
  avustushakuName,
  avustushakuId,
  userInfo,
}: TaloustarkastusEmailProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const taloustarkastettu = hakemus['status-loppuselvitys'] === 'accepted'
  const senderName = userInfo['first-name'].split(' ')[0] + ' ' + userInfo['surname']
  const projectName = loppuselvitys['project-name'] || hakemus['project-name'] || ''
  const registerNumber = loppuselvitys['register-number'] || ''
  const selvitysEmail = loppuselvitys['selvitys-email']
  const isTaloustarkastettu = taloustarkastettu && selvitysEmail !== undefined
  const lang = hakemus.language
  const [email, setEmail] = useState(() =>
    isTaloustarkastettu
      ? sentEmail(lang, selvitysEmail)
      : {
          lang,
          subject: createEmailSubject(registerNumber)[lang],
          content: createEmailContent(projectName, avustushakuName, senderName, userInfo.email)[
            lang
          ],
          receivers: initialRecipientEmails(
            (loppuselvitys.answers ?? []).concat(hakemus.answers),
            hakemus.normalizedData
          ),
        }
  )

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    await HttpUtil.post(`/api/avustushaku/${avustushakuId}/selvitys/loppuselvitys/send`, {
      message: email.content,
      'selvitys-hakemus-id': loppuselvitys.id,
      to: email.receivers,
      subject: email.subject,
    })
    await dispatch(loadSelvitys({ avustushakuId, hakemusId: hakemus.id }))
    await dispatch(refreshHakemukset({ avustushakuId, hakemusId: hakemus.id }))
  }

  return (
    <MultipleRecipentEmailForm
      onSubmit={onSubmit}
      disabled={isTaloustarkastettu}
      email={email}
      setEmail={setEmail}
      formName="taloustarkastus"
      submitText="Hyväksy taloustarkastus ja lähetä viesti"
      heading="Taloustarkastus ja loppuselvityksen hyväksyntä"
      disabledSubmitButton={
        <VerificationBox
          title="Taloustarkastettu ja lähetetty hakijalle"
          date={hakemus['loppuselvitys-taloustarkastettu-at']}
          verifier={hakemus['loppuselvitys-taloustarkastanut-name']}
        />
      }
    />
  )
}

function createEmailSubjectFi(registerNumber: string) {
  return `Loppuselvitys ${registerNumber} käsitelty`
}

function createEmailSubjectSv(registerNumber: string) {
  return `Slutredovisningen ${registerNumber} är behandlad`
}

function createEmailContentFi(
  projectName: string,
  avustushakuName: string,
  senderName: string,
  senderEmail: string
) {
  return `Hyvä vastaanottaja,

Opetushallitus on tarkastanut hankkeen "${projectName}" ("${avustushakuName}") valtionavustusta koskevan loppuselvityksen ja toteaa avustusta koskevan asian käsittelyn päättyneeksi.

Opetushallitus voi asian käsittelyn päättämisestä huolimatta periä avustuksen tai osan siitä takaisin, jos sen tietoon tulee uusi seikka, joka valtionavustuslain 21 tai 22 §:n mukaisesti velvoittaa tai oikeuttaa takaisinperintään.

Terveisin,
${senderName}
${senderEmail}`
}

function createEmailContentSv(
  projectName: string,
  avustushakuName: string,
  senderName: string,
  senderEmail: string
) {
  return `Bästa mottagare

Utbildningsstyrelsen har granskat slutredovisningen för projektet "${projectName}" ("${avustushakuName}") och bekräftar att ärendet nu är slutbehandlat.

Utbildningsstyrelsen kan trots beslut om att ärendet är slutbehandlat kräva tillbaka understödet eller en del av det, om Utbildningsstyrelsen får ny information om ärendet som enligt 21 § eller 22 § i statsunderstödslagen förpliktar eller ger rätt till återkrav.

Med vänlig hälsning,
${senderName}
${senderEmail}`
}

function createEmailContent(
  projectName: string,
  avustushakuName: string,
  senderName: string,
  senderEmail: string
) {
  return {
    fi: createEmailContentFi(projectName, avustushakuName, senderName, senderEmail),
    sv: createEmailContentSv(projectName, avustushakuName, senderName, senderEmail),
  }
}

function createEmailSubject(registerNumber: string) {
  return {
    fi: createEmailSubjectFi(registerNumber),
    sv: createEmailSubjectSv(registerNumber),
  }
}

function sentEmail(lang: Language, sentEmail: SelvitysEmail) {
  return {
    lang,
    receivers: sentEmail.to,
    subject: sentEmail.subject,
    content: sentEmail.message,
  }
}
