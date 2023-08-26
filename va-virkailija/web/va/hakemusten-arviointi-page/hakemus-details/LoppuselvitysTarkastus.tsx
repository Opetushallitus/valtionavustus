import { Hakemus, SelvitysEmail } from 'soresu-form/web/va/types'
import ViestiLista, { ViestiDetails, ViestiListaRow } from './ViestiLista'
import { useHakemus } from '../useHakemus'
import { useAvustushakuId } from '../useAvustushaku'
import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'
import { isString } from 'lodash'
import {
  EmailType,
  useGetTapahtumalokiForEmailTypeQuery,
  usePostLoppuselvitysTaydennyspyyntoMutation,
} from '../../apiSlice'
import { hasFetchErrorMsg } from '../../isFetchBaseQueryError'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { getLoadedState, loadSelvitys, refreshHakemukset } from '../arviointiReducer'
import { useHakemustenArviointiDispatch, useHakemustenArviointiSelector } from '../arviointiStore'
import { initialRecipientEmails } from './emailRecipients'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { VerificationBox } from './VerificationBox'

function createInitialTaydennyspyyntoEmail(hakemus: Hakemus) {
  const contactEmail = hakemus.normalizedData?.['contact-email']
  const trustedContactEmail = hakemus.normalizedData?.['trusted-contact-email']
  return {
    lang: hakemus.language,
    subject: '',
    content: '',
    receivers: [contactEmail, trustedContactEmail].filter(isString),
  }
}

export function Asiatarkastus({ disabled }: { disabled: boolean }) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const dispatch = useHakemustenArviointiDispatch()
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const verifiedBy = hakemus['loppuselvitys-information-verified-by']
  const verifiedAt = hakemus['loppuselvitys-information-verified-at']
  const verification = hakemus['loppuselvitys-information-verification']
  const onSubmit = async () => {
    await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemus.id}/loppuselvitys/verify-information`,
      { message: '' }
    )
    dispatch(
      refreshHakemukset({
        avustushakuId,
        hakemusId: hakemus.id,
      })
    )
  }
  const onClick = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (showConfirmation) {
      await onSubmit()
    } else {
      setShowConfirmation(true)
    }
  }
  return (
    <LoppuselvitysTarkastus
      dataTestId="loppuselvitys-asiatarkastus"
      taydennyspyyntoType="taydennyspyynto-asiatarkastus"
      disabled={disabled}
      heading="Loppuselvityksen asiatarkastus"
      taydennyspyyntoHeading="Asiatarkastuksen täydennyspyyntö"
      confirmButton={
        <button disabled={disabled} onClick={onClick}>
          {showConfirmation ? 'Vahvista hyväksyntä' : 'Hyväksy'}
        </button>
      }
      completedBy={
        verifiedAt && verifiedBy
          ? {
              name: verifiedBy,
              date: verifiedAt,
              heading: 'Asiatarkastettu',
              component: (
                <div className={'messageDetails'}>
                  <div className={'rowMessage'}>{verification}</div>
                </div>
              ),
            }
          : undefined
      }
    />
  )
}

export function Taloustarkastus({ disabled }: { disabled: boolean }) {
  const hakemus = useHakemus()
  const avustushaku = useHakemustenArviointiSelector(
    (s) => getLoadedState(s.arviointi).hakuData.avustushaku
  )
  const [showEmail, toggleEmail] = useState(false)
  const userInfo = useHakemustenArviointiSelector((s) => getLoadedState(s.arviointi).userInfo)
  const lang = hakemus.language
  const loppuselvitys = hakemus.selvitys?.loppuselvitys
  const taloustarkastettu = hakemus['status-loppuselvitys'] === 'accepted'
  const senderName = userInfo['first-name'].split(' ')[0] + ' ' + userInfo['surname']
  const projectName = loppuselvitys?.['project-name'] || hakemus['project-name'] || ''
  const registerNumber = loppuselvitys?.['register-number'] || ''
  const selvitysEmail = loppuselvitys?.['selvitys-email']
  const dispatch = useHakemustenArviointiDispatch()
  const isTaloustarkastettu = taloustarkastettu && !!selvitysEmail
  const [email, setEmail] = useState(() =>
    isTaloustarkastettu
      ? sentEmail(lang, selvitysEmail)
      : {
          lang,
          subject: createEmailSubject(registerNumber)[lang],
          content: createEmailContent(
            projectName,
            avustushaku.content.name[lang],
            senderName,
            userInfo.email
          )[lang],
          receivers: initialRecipientEmails(
            (loppuselvitys?.answers ?? []).concat(hakemus.answers),
            hakemus.normalizedData
          ),
        }
  )
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    await HttpUtil.post(`/api/avustushaku/${avustushaku.id}/selvitys/loppuselvitys/send`, {
      message: email.content,
      'selvitys-hakemus-id': loppuselvitys!.id,
      to: email.receivers,
      subject: email.subject,
    })
    await dispatch(loadSelvitys({ avustushakuId: avustushaku.id, hakemusId: hakemus.id }))
    await dispatch(refreshHakemukset({ avustushakuId: avustushaku.id, hakemusId: hakemus.id }))
  }

  return (
    <>
      <LoppuselvitysTarkastus
        dataTestId="loppuselvitys-taloustarkastus"
        taydennyspyyntoType="taydennyspyynto-taloustarkastus"
        disabled={disabled || showEmail}
        heading="Loppuselvityksen taloustarkastus"
        taydennyspyyntoHeading="Taloustarkastuksen täydennyspyyntö"
        completedBy={
          isTaloustarkastettu &&
          hakemus['loppuselvitys-taloustarkastanut-name'] &&
          hakemus['loppuselvitys-taloustarkastettu-at']
            ? {
                name: hakemus['loppuselvitys-taloustarkastanut-name'],
                date: hakemus['loppuselvitys-taloustarkastettu-at'],
                heading: 'Hyväksytty',
                component: (
                  <ViestiDetails
                    message={{
                      id: 123456789,
                      date: hakemus['loppuselvitys-taloustarkastettu-at'],
                      virkailija: hakemus['loppuselvitys-taloustarkastanut-name'],
                      sender: 'no-reply@oph.fi',
                      receivers: selvitysEmail?.to,
                      message: selvitysEmail?.message,
                      subject: selvitysEmail?.subject,
                    }}
                  />
                ),
              }
            : undefined
        }
        confirmButton={
          <button
            disabled={disabled || showEmail}
            onClick={() => {
              toggleEmail((show) => !show)
            }}
          >
            {'Hyväksy'}
          </button>
        }
      />
      {!isTaloustarkastettu && showEmail && (
        <div style={{ marginTop: '8px' }}>
          <MultipleRecipentEmailForm
            onSubmit={onSubmit}
            disabled={isTaloustarkastettu}
            email={email}
            setEmail={setEmail}
            formName="taloustarkastus"
            submitText="Hyväksy ja lähetä viesti"
            heading="Taloustarkastus ja loppuselvityksen hyväksyntä"
            disabledSubmitButton={
              <VerificationBox
                title="Taloustarkastettu ja lähetetty hakijalle"
                date={hakemus['loppuselvitys-taloustarkastettu-at']}
                verifier={hakemus['loppuselvitys-taloustarkastanut-name']}
              />
            }
            cancelButton={{
              text: 'Peruuta',
              onClick: () => toggleEmail((show) => !show),
            }}
          />
        </div>
      )}
    </>
  )
}

interface LoppuselvitysTarkastusProps {
  taydennyspyyntoType: EmailType
  disabled: boolean
  heading: string
  taydennyspyyntoHeading: string
  confirmButton: React.JSX.Element
  dataTestId: string
  completedBy?: {
    name: string
    date: string
    heading: string
    component?: React.ReactNode
  }
}

function LoppuselvitysTarkastus({
  dataTestId,
  disabled,
  heading,
  taydennyspyyntoHeading,
  taydennyspyyntoType,
  confirmButton,
  completedBy,
}: LoppuselvitysTarkastusProps) {
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const { data: sentEmails } = useGetTapahtumalokiForEmailTypeQuery({
    hakemusId: hakemus.id,
    avustushakuId,
    emailType: taydennyspyyntoType,
  })
  const dispatch = useHakemustenArviointiDispatch()
  const [addTaydennyspyynto] = usePostLoppuselvitysTaydennyspyyntoMutation()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const emailFormRef = useRef<HTMLDivElement>(null)
  const [formErrorMessage, setFormErrorMessage] = useState<string>()
  const [email, setEmail] = useState(createInitialTaydennyspyyntoEmail(hakemus))
  const revealEmailForm = () => emailFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (showEmailForm) {
      revealEmailForm() // reveal after showEmailForm changes to true and component is mounted
    }
  }, [showEmailForm])

  function openOrRevealEmailForm() {
    setShowEmailForm(true)
    revealEmailForm() // try reveal here, only works when form is open, therefore the component is already mounted
  }

  function cancelForm() {
    setEmail(createInitialTaydennyspyyntoEmail(hakemus))
    setShowEmailForm(false)
    setFormErrorMessage(undefined)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await addTaydennyspyynto({
        hakemusId: hakemus.id,
        avustushakuId,
        email: {
          lang: email.lang,
          type: taydennyspyyntoType,
          body: email.content,
          subject: email.subject,
          to: email.receivers,
        },
      }).unwrap()
      await dispatch(loadSelvitys({ avustushakuId, hakemusId: hakemus.id })).unwrap()
      setFormErrorMessage(undefined)
      cancelForm()
    } catch (err) {
      if (hasFetchErrorMsg(err)) {
        setFormErrorMessage(err.data.error)
      } else {
        setFormErrorMessage('Täydennyspyynnön lähetys epäonnistui')
      }
    }
  }

  const noBottomBorder = !!sentEmails?.length || showEmailForm || completedBy

  return (
    <>
      <div
        data-test-id={dataTestId}
        className={cn('writeMuistutusviesti', {
          ['noBottomBorder']: noBottomBorder,
        })}
      >
        <h2>{heading}</h2>
        <div>
          <button
            onClick={openOrRevealEmailForm}
            disabled={disabled || showEmailForm}
            className="writeMuistutusviestiButton"
          >
            Täydennyspyyntö
          </button>
          {confirmButton}
        </div>
      </div>
      <ViestiLista heading="Täydennyspyyntö" messages={sentEmails ?? []} />
      {completedBy && (
        <ViestiListaRow
          icon="done"
          virkailija={completedBy.name}
          date={completedBy.date}
          onClick={() => setShowMessage((show) => !show)}
          heading={completedBy.heading}
          dataTestId="loppuselvitys-tarkastus"
        >
          {showMessage && completedBy.component}
        </ViestiListaRow>
      )}
      {showEmailForm && (
        <MultipleRecipentEmailForm
          ref={emailFormRef}
          onSubmit={onSubmit}
          email={email}
          setEmail={setEmail}
          formName={`loppuselvitys-${taydennyspyyntoType}`}
          submitText="Lähetä täydennyspyyntö"
          heading={taydennyspyyntoHeading}
          cancelButton={{
            text: 'Peruuta',
            onClick: cancelForm,
          }}
          errorText={formErrorMessage}
        />
      )}
    </>
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