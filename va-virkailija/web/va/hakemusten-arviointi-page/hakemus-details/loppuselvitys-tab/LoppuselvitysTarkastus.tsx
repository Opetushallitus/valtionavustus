import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'

import { Hakemus, SelvitysEmail } from 'soresu-form/web/va/types'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { Language, translations } from 'soresu-form/web/va/i18n/translations'

import ViestiLista, { ViestiDetails, ViestiListaRow } from '../ViestiLista'
import { useHakemus } from '../../useHakemus'
import { useAvustushakuId } from '../../useAvustushaku'
import MultipleRecipentEmailForm, { Email } from '../common-components/MultipleRecipentsEmailForm'
import {
  EmailType,
  useGetTapahtumalokiForEmailTypeQuery,
  usePostLoppuselvitysTaydennyspyyntoMutation,
} from '../../../apiSlice'
import { hasFetchErrorMsg } from '../../../isFetchBaseQueryError'
import { useEnvironment, useUserInfo } from '../../../initial-data-context'
import { getLoadedAvustushakuData, refreshHakemus } from '../../arviointiReducer'
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from '../../arviointiStore'
import { initialRecipientEmails } from '../emailRecipients'
import { VerificationBox } from './VerificationBox'
import { UserInfo } from '../../../types'

function createInitialTaydennyspyyntoEmail(
  hakemus: Hakemus,
  avustushakuId: number,
  userInfo: UserInfo,
  hakijaServerUrl: string
): Email {
  const arkistointiTunnus = hakemus['register-number']
  const hakemusName = hakemus['project-name']
  const userKey = hakemus['user-key']
  const selvitysType = 'loppuselvitys'
  const publicUrl = `avustushaku/${avustushakuId}/${selvitysType}?hakemus=${userKey}`
  const fullUrl = `${hakijaServerUrl}${publicUrl}`
  const initialEmails = initialRecipientEmails(hakemus, hakemus.normalizedData)
  return {
    lang: hakemus.language,
    subject: translations[hakemus.language].loppuselvitys.asiatarkastus.subject(
      arkistointiTunnus!,
      hakemusName
    ),
    content: '',
    placeholder: translations[hakemus.language].loppuselvitys.asiatarkastus.content,
    receivers: initialEmails,
    header: translations[hakemus.language].loppuselvitys.asiatarkastus.header(
      arkistointiTunnus!,
      hakemusName
    ),
    footer: translations[hakemus.language].loppuselvitys.asiatarkastus.footer(
      fullUrl,
      userInfo['first-name'],
      userInfo['surname'],
      userInfo.email
    ),
  }
}

export function Asiatarkastus({ disabled }: { disabled: boolean }) {
  const dispatch = useHakemustenArviointiDispatch()
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const [message, setMessage] = useState<string>()
  const verifiedBy = hakemus['loppuselvitys-information-verified-by']
  const verifiedAt = hakemus['loppuselvitys-information-verified-at']
  const verification = hakemus['loppuselvitys-information-verification']
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemus.id}/loppuselvitys/verify-information`,
      { message }
    )
    dispatch(refreshHakemus({ hakemusId: hakemus.id })).unwrap()
    setMessage('')
  }
  const hakemusLoppuselvitysNotSubmitted = hakemus.selvitys?.loppuselvitys.status !== 'submitted'
  const disableAcceptButton = hakemusLoppuselvitysNotSubmitted || !message || disabled
  const asiatarkastusVerified = verifiedAt && verifiedBy
  return (
    <>
      <LoppuselvitysTarkastus
        dataTestId="loppuselvitys-asiatarkastus"
        taydennyspyyntoType="taydennyspyynto-asiatarkastus"
        disabled={disabled}
        heading="Loppuselvityksen asiatarkastus"
        taydennyspyyntoHeading="Asiatarkastuksen täydennyspyyntö"
        confirmButton={<></>}
        completedBy={
          asiatarkastusVerified
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
        showCancelButton={
          hakemus.selvitys?.loppuselvitys.status === 'pending_change_request' &&
          !hakemus['loppuselvitys-information-verified-at'] &&
          !hakemus['loppuselvitys-taloustarkastettu-at']
        }
      />
      {!asiatarkastusVerified && (
        <form onSubmit={onSubmit}>
          <div className="verification-comment">
            <textarea
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={disabled}
              name="information-verification"
              placeholder="Kirjaa tähän mahdolliset huomiot asiatarkastuksesta"
            />
          </div>
          <div className="verification-footer">
            <button type="submit" name="submit-verification" disabled={disableAcceptButton}>
              Hyväksy asiatarkastus ja lähetä taloustarkastukseen
            </button>
          </div>
        </form>
      )}
    </>
  )
}

export function Taloustarkastus({ disabled }: { disabled: boolean }) {
  const loggedInUser = useUserInfo()
  const hakemus = useHakemus()
  const avustushaku = useHakemustenArviointiSelector(
    (s) => getLoadedAvustushakuData(s.arviointi).hakuData.avustushaku
  )
  const [showEmail, toggleEmail] = useState(false)
  const userInfo = useUserInfo()
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
          receivers: initialRecipientEmails(hakemus, hakemus.normalizedData),
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
    await dispatch(refreshHakemus({ hakemusId: hakemus.id }))
  }

  const hakemusLoppuselvitysNotSubmitted = hakemus.selvitys?.loppuselvitys.status !== 'submitted'
  const disableAcceptButton = hakemusLoppuselvitysNotSubmitted || disabled
  console.log(selvitysEmail?.to)
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
                      sender: 'no-reply@valtionavustukset.oph.fi',
                      reply_to: loggedInUser.email,
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
            disabled={disableAcceptButton || showEmail}
            onClick={() => {
              toggleEmail((show) => !show)
            }}
          >
            {'Hyväksy'}
          </button>
        }
        showCancelButton={
          hakemus.selvitys?.loppuselvitys.status === 'pending_change_request' &&
          !!hakemus['loppuselvitys-information-verified-at'] &&
          !hakemus['loppuselvitys-taloustarkastettu-at']
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
  showCancelButton: boolean
}

function LoppuselvitysTarkastus({
  dataTestId,
  disabled,
  heading,
  taydennyspyyntoHeading,
  taydennyspyyntoType,
  confirmButton,
  completedBy,
  showCancelButton,
}: LoppuselvitysTarkastusProps) {
  const hakemus = useHakemus()
  const userInfo = useUserInfo()
  const env = useEnvironment()
  const hakijaServerUrl = env['hakija-server'].url[hakemus.language]
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
  const [email, setEmail] = useState(
    createInitialTaydennyspyyntoEmail(hakemus, avustushakuId, userInfo, hakijaServerUrl)
  )
  const revealEmailForm = () => emailFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  const [showMessage, setShowMessage] = useState(false)
  const [cancellingTaydennys, setCancellingTaydennys] = useState(false)
  const [cancelErrorMsg, setCancelErrorMsg] = useState<string>()

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
    setEmail(createInitialTaydennyspyyntoEmail(hakemus, avustushakuId, userInfo, hakijaServerUrl))
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
          body: `${email.header}

${email.content}

${email.footer}`,
          subject: email.subject,
          to: email.receivers,
        },
      }).unwrap()
      dispatch(refreshHakemus({ hakemusId: hakemus.id }))
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

  async function cancelTaydennyspyynto() {
    try {
      setCancellingTaydennys(true)
      setCancelErrorMsg('')
      await HttpUtil.put(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemus.id}/loppuselvitys/cancel-taydennyspyynto`
      )
      dispatch(refreshHakemus({ hakemusId: hakemus.id }))
    } catch (e) {
      setCancelErrorMsg('Peruminen epäonnistui')
    } finally {
      setCancellingTaydennys(false)
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
          {showEmailForm ? (
            <button onClick={() => setShowEmailForm(false)} style={{ marginRight: '14px' }}>
              Peruuta lähetys
            </button>
          ) : showCancelButton ? (
            <button
              onClick={cancelTaydennyspyynto}
              disabled={cancellingTaydennys}
              style={{ marginRight: '14px' }}
            >
              Peru täydennyspyyntö
            </button>
          ) : (
            <button
              onClick={openOrRevealEmailForm}
              disabled={disabled || showEmailForm}
              className="writeMuistutusviestiButton"
            >
              Täydennyspyyntö
            </button>
          )}
          {confirmButton}
        </div>
      </div>
      {cancelErrorMsg && (
        <div className="error">
          <span>{cancelErrorMsg}</span>
        </div>
      )}
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
