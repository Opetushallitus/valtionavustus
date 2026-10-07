import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'

import {
  AsiatarkastusChecklist,
  AsiatarkastusChecklistKey,
  Hakemus,
  SelvitysEmail,
} from 'soresu-form/web/va/types'
import HttpUtil, { getHttpResponseErrorStatus } from 'soresu-form/web/HttpUtil'
import { Language, translations } from 'soresu-form/web/va/i18n/translations'

import { ConfirmDialog } from '../../../common-components/ConfirmDialog'
import ViestiLista, { ViestiDetails, ViestiListaRow, ViestiListaStaticRow } from '../ViestiLista'
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
import {
  getLoppuselvitysOrgEmail,
  getOrgEmailWarningMessage,
  getStoredOrgEmail,
  getValiselvitysOrgEmail,
  prependOrgEmailToReceivers,
  resolveOrgEmailFallback,
  usePrependCurrentOrgEmailToReceivers,
} from '../useCurrentOrganisationEmail'
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

const ASIATARKASTUS_CHECKLIST_ITEMS: readonly { key: AsiatarkastusChecklistKey; label: string }[] =
  [
    {
      key: 'avustus-kaytetty-paatoksen-mukaisesti',
      label: 'Avustus on käytetty avustuspäätöksessä annettujen ehtojen mukaisesti',
    },
    {
      key: 'omarahoitus-kaytetty',
      label:
        'Myönnetty avustus on käytetty kokonaan (ml. mahdollinen omarahoitusosuus) ja mahdollisesti käyttämättä jäänyt avustus on palautettu',
    },
    {
      key: 'taloustiedot-kirjattu',
      label:
        'Avustuksen saaja on kirjannut loppuselvitykseen siinä vaaditut taloustiedot annettujen ohjeiden mukaisesti (ml. mahdolliset talousliitteet)',
    },
    { key: 'avustus-alle-100k', label: 'Myönnetty avustus on alle 100 000 euroa' },
  ]

const INITIAL_ASIATARKASTUS_CHECKLIST: AsiatarkastusChecklist = {
  'avustus-kaytetty-paatoksen-mukaisesti': undefined,
  'omarahoitus-kaytetty': undefined,
  'taloustiedot-kirjattu': undefined,
  'avustus-alle-100k': undefined,
}

function AsiatarkastusChecklistInput({
  checklist,
  disabled,
  onChange,
}: {
  checklist: AsiatarkastusChecklist
  disabled: boolean
  onChange: (key: AsiatarkastusChecklistKey, value: boolean) => void
}) {
  return (
    <div className="verification-checklist" data-test-id="asiatarkastus-checklist">
      {ASIATARKASTUS_CHECKLIST_ITEMS.map((item) => (
        <div key={item.key} className="verification-checklist-item">
          <fieldset className="soresu-radiobutton-group">
            <input
              id={`${item.key}-true`}
              type="radio"
              name={item.key}
              value="true"
              checked={checklist[item.key] === true}
              disabled={disabled}
              onChange={() => onChange(item.key, true)}
            />
            <label htmlFor={`${item.key}-true`}>Kyllä</label>
            <input
              id={`${item.key}-false`}
              type="radio"
              name={item.key}
              value="false"
              checked={checklist[item.key] === false}
              disabled={disabled}
              onChange={() => onChange(item.key, false)}
            />
            <label htmlFor={`${item.key}-false`}>Ei</label>
          </fieldset>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function CommentTextarea({
  message,
  setMessage,
  disabled,
}: {
  message: string | undefined
  setMessage: (m: string) => void
  disabled: boolean
}) {
  return (
    <div className="verification-comment">
      <textarea
        value={message ?? ''}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        disabled={disabled}
        name="information-verification"
        placeholder="Kirjaa tähän mahdolliset huomiot asiatarkastuksesta"
      />
    </div>
  )
}

function AvattavaTarkastusRow({
  name,
  date,
  heading,
  dataTestId,
  children,
}: {
  name: string
  date: string
  heading: string
  dataTestId: string
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <ViestiListaRow
      icon="done"
      virkailija={name}
      date={date}
      onClick={() => setOpen((show) => !show)}
      heading={heading}
      dataTestId={dataTestId}
    >
      {open && children}
    </ViestiListaRow>
  )
}

function AsiatarkastusContent({
  verification,
  children,
}: {
  verification?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="asiatarkastettu-content">
      {children}
      <div className={'messageDetails'}>
        <div className={'rowMessage'}>{verification}</div>
      </div>
    </div>
  )
}

function VerifiedDrawer({ hakemus, showChecklist }: { hakemus: Hakemus; showChecklist: boolean }) {
  const verifiedBy = hakemus['loppuselvitys-information-verified-by']
  const verifiedAt = hakemus['loppuselvitys-information-verified-at']
  const verification = hakemus['loppuselvitys-information-verification']
  const savedChecklist = hakemus['asiatarkastus-checklist']
  if (!verifiedBy || !verifiedAt) return null
  return (
    <AsiatarkastusContent verification={verification}>
      {showChecklist && savedChecklist && (
        <div className="verification-checklist-readonly">
          <AsiatarkastusChecklistInput
            checklist={savedChecklist}
            disabled={true}
            onChange={() => {}}
          />
        </div>
      )}
    </AsiatarkastusContent>
  )
}

function buildVerifiedCompletedBy(hakemus: Hakemus, showChecklist: boolean) {
  const verifiedBy = hakemus['loppuselvitys-information-verified-by']
  const verifiedAt = hakemus['loppuselvitys-information-verified-at']
  if (!verifiedBy || !verifiedAt) return undefined
  return {
    name: verifiedBy,
    date: verifiedAt,
    heading: 'Asiatarkastettu',
    component: <VerifiedDrawer hakemus={hakemus} showChecklist={showChecklist} />,
  }
}

function showCancelTaydennyspyynto(hakemus: Hakemus) {
  return (
    hakemus.selvitys?.loppuselvitys.status === 'pending_change_request' &&
    !hakemus['loppuselvitys-information-verified-at'] &&
    !hakemus['loppuselvitys-taloustarkastettu-at']
  )
}

function useAsiatarkastusSubmit() {
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const dispatch = useHakemustenArviointiDispatch()
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const submissionStarted = useRef(false)

  const submit = async (body: unknown) => {
    if (submissionStarted.current) return false
    submissionStarted.current = true
    setSubmitting(true)
    setError(undefined)
    try {
      await HttpUtil.post(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemus.id}/loppuselvitys/verify-information`,
        body
      )
    } catch {
      submissionStarted.current = false
      setSubmitting(false)
      setError('Asiatarkastuksen hyväksyminen epäonnistui')
      return false
    }
    // Approval is saved. Keep it locked even if refreshing the view is slow or fails.
    dispatch(refreshHakemus({ hakemusId: hakemus.id }))
    return true
  }

  return { submit, submitting, error }
}

function Asiatarkastus2Vaiheinen({ disabled }: { disabled: boolean }) {
  const hakemus = useHakemus()
  const [message, setMessage] = useState<string>()
  const { submit, submitting, error } = useAsiatarkastusSubmit()
  const verifiedBy = hakemus['loppuselvitys-information-verified-by']
  const verifiedAt = hakemus['loppuselvitys-information-verified-at']
  const isVerified = !!verifiedBy && !!verifiedAt
  const loppuselvitysNotSubmitted = hakemus.selvitys?.loppuselvitys.status !== 'submitted'
  const disableSubmit = loppuselvitysNotSubmitted || !message || disabled || submitting

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (await submit({ message })) setMessage('')
  }

  return (
    <>
      <LoppuselvitysTarkastus
        dataTestId="loppuselvitys-asiatarkastus"
        showPalautukset
        taydennyspyyntoType="taydennyspyynto-asiatarkastus"
        disabled={disabled}
        heading="Loppuselvityksen asiatarkastus"
        taydennyspyyntoHeading="Asiatarkastuksen täydennyspyyntö"
        confirmButton={<></>}
        completedBy={buildVerifiedCompletedBy(hakemus, false)}
        showCancelButton={showCancelTaydennyspyynto(hakemus)}
      />
      {!isVerified && (
        <>
          <CommentTextarea message={message} setMessage={setMessage} disabled={disabled} />
          <form onSubmit={onSubmit}>
            <div className="verification-footer">
              <button type="submit" name="submit-verification" disabled={disableSubmit}>
                Hyväksy asiatarkastus ja lähetä taloustarkastukseen
              </button>
              {error && <div className="error">{error}</div>}
            </div>
          </form>
        </>
      )}
    </>
  )
}

function AsiatarkastusSatunnaisotanta({ disabled }: { disabled: boolean }) {
  const hakemus = useHakemus()
  const [message, setMessage] = useState<string>()
  const [checklist, setChecklist] = useState<AsiatarkastusChecklist>(
    INITIAL_ASIATARKASTUS_CHECKLIST
  )
  const { submit, submitting, error } = useAsiatarkastusSubmit()
  const verifiedBy = hakemus['loppuselvitys-information-verified-by']
  const verifiedAt = hakemus['loppuselvitys-information-verified-at']
  const isVerified = !!verifiedBy && !!verifiedAt
  const allAnswered = Object.values(checklist).every((v) => v !== undefined)
  const allChecked = allAnswered && Object.values(checklist).every(Boolean)
  const loppuselvitysNotSubmitted = hakemus.selvitys?.loppuselvitys.status !== 'submitted'
  // comment is optional unless a risk was found (not all checklist items checked)
  const disableSubmit =
    loppuselvitysNotSubmitted || disabled || submitting || !allAnswered || (!allChecked && !message)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (await submit({ message: message ?? '', checklist })) setMessage('')
  }

  return (
    <>
      <LoppuselvitysTarkastus
        dataTestId="loppuselvitys-asiatarkastus"
        showPalautukset
        taydennyspyyntoType="taydennyspyynto-asiatarkastus"
        disabled={disabled}
        heading="Loppuselvityksen asiatarkastus"
        taydennyspyyntoHeading="Asiatarkastuksen täydennyspyyntö"
        confirmButton={<></>}
        completedBy={buildVerifiedCompletedBy(hakemus, true)}
        showCancelButton={showCancelTaydennyspyynto(hakemus)}
      />
      {!isVerified && (
        <>
          <AsiatarkastusChecklistInput
            checklist={checklist}
            disabled={disabled}
            onChange={(key, value) => setChecklist((prev) => ({ ...prev, [key]: value }))}
          />
          {allAnswered && (
            <>
              <div className="otantapolku-banner" data-test-id="satunnaisotanta-banner">
                Tämä loppuselvitys on valittu satunnaisotannalla taloustarkastukseen. Kirjaa
                tarvittaessa asiatarkastusta koskevat huomiosi taloustarkastajalle ja lähetä
                loppuselvitys taloustarkastukseen.
              </div>
              <CommentTextarea message={message} setMessage={setMessage} disabled={disabled} />
              <form onSubmit={onSubmit}>
                <div className="verification-footer">
                  <button type="submit" name="submit-verification" disabled={disableSubmit}>
                    Hyväksy asiatarkastus ja lähetä taloustarkastukseen
                  </button>
                  {error && <div className="error">{error}</div>}
                </div>
              </form>
            </>
          )}
        </>
      )}
    </>
  )
}

function AsiatarkastusOtannanUlkopuolella({ disabled }: { disabled: boolean }) {
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const userInfo = useUserInfo()
  const avustushakuFromStore = useHakemustenArviointiSelector(
    (s) => getLoadedAvustushakuData(s.arviointi).hakuData.avustushaku
  )
  const [message, setMessage] = useState<string>()
  const [checklist, setChecklist] = useState<AsiatarkastusChecklist>(
    INITIAL_ASIATARKASTUS_CHECKLIST
  )
  const { submit, submitting, error } = useAsiatarkastusSubmit()
  const [showHyvaksytty, setShowHyvaksytty] = useState(false)

  const verifiedBy = hakemus['loppuselvitys-information-verified-by']
  const verifiedAt = hakemus['loppuselvitys-information-verified-at']
  const isVerified = !!verifiedBy && !!verifiedAt
  const lang = hakemus.language
  const loppuselvitys = hakemus.selvitys?.loppuselvitys
  const senderName = userInfo['first-name'].split(' ')[0] + ' ' + userInfo['surname']
  const projectName = loppuselvitys?.['project-name'] || hakemus['project-name'] || ''
  const registerNumber = loppuselvitys?.['register-number'] || ''
  const isAccepted = hakemus['status-loppuselvitys'] === 'accepted'
  const selvitysEmail = loppuselvitys?.['selvitys-email']

  const [approvalEmail, setApprovalEmail] = useState<Email>(() => ({
    lang,
    subject: createEmailSubject(registerNumber)[lang],
    content: createEmailContent(
      projectName,
      avustushakuFromStore.content.name[lang],
      senderName,
      userInfo.email
    )[lang],
    receivers: initialRecipientEmails(hakemus, hakemus.normalizedData),
  }))
  const {
    pending: orgEmailPending,
    currentOrgEmail,
    orgEmailFallback,
    orgEmailMissing,
  } = usePrependCurrentOrgEmailToReceivers(
    avustushakuId,
    hakemus.id,
    setApprovalEmail,
    true,
    resolveOrgEmailFallback(
      getLoppuselvitysOrgEmail(hakemus),
      getValiselvitysOrgEmail(hakemus),
      getStoredOrgEmail(hakemus)
    )
  )

  const allAnswered = Object.values(checklist).every((v) => v !== undefined)
  const allChecked = allAnswered && Object.values(checklist).every(Boolean)
  const loppuselvitysNotSubmitted = hakemus.selvitys?.loppuselvitys.status !== 'submitted'
  const disableRiskiSubmit =
    loppuselvitysNotSubmitted || !message || disabled || submitting || !allAnswered
  const disableAsiatarkastaAndAcceptSubmit = loppuselvitysNotSubmitted || disabled || submitting

  const onSubmitRiski = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (await submit({ message, checklist })) setMessage('')
  }

  const onSubmitAsiatarkastaAndAccept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (
      await submit({
        message: message ?? '',
        checklist,
        email: {
          to: approvalEmail.receivers,
          subject: approvalEmail.subject,
          message: approvalEmail.content,
          'selvitys-hakemus-id': loppuselvitys!.id,
        },
      })
    ) {
      setMessage('')
    }
  }

  return (
    <>
      <LoppuselvitysTarkastus
        dataTestId="loppuselvitys-asiatarkastus"
        showPalautukset
        taydennyspyyntoType="taydennyspyynto-asiatarkastus"
        disabled={disabled}
        heading="Loppuselvityksen asiatarkastus"
        taydennyspyyntoHeading="Asiatarkastuksen täydennyspyyntö"
        confirmButton={<></>}
        completedBy={buildVerifiedCompletedBy(hakemus, true)}
        showCancelButton={showCancelTaydennyspyynto(hakemus)}
      />
      {!isVerified && (
        <>
          <AsiatarkastusChecklistInput
            checklist={checklist}
            disabled={disabled}
            onChange={(key, value) => setChecklist((prev) => ({ ...prev, [key]: value }))}
          />
          {allAnswered && (
            <>
              {!allChecked && (
                <div
                  className="otantapolku-banner"
                  data-test-id="otannan-ulkopuolella-riski-banner"
                >
                  Loppuselvityksen asiatarkastuksessa havaittiin taloustarkastusta edellyttävä
                  riski. Selvitys siirtyy automaattisesti taloustarkastukseen jatkokäsittelyä
                  varten.
                </div>
              )}
              {allChecked && (
                <div
                  className="otantapolku-banner"
                  data-test-id="otannan-ulkopuolella-suora-hyvaksynta-banner"
                >
                  Loppuselvityksessä ei havaittu taloustarkastusta edellyttäviä riskejä eikä sitä
                  valittu satunnaisotantaan. Hyväksy loppuselvitys ja lähetä hyväksyntäviesti
                  avustuksen saajalle.
                </div>
              )}
              <CommentTextarea message={message} setMessage={setMessage} disabled={disabled} />
              {allChecked ? (
                <MultipleRecipentEmailForm
                  onSubmit={onSubmitAsiatarkastaAndAccept}
                  disabled={disableAsiatarkastaAndAcceptSubmit}
                  submitDisabled={orgEmailPending}
                  warning={
                    orgEmailFallback || orgEmailMissing
                      ? getOrgEmailWarningMessage(currentOrgEmail ?? '')
                      : undefined
                  }
                  email={approvalEmail}
                  setEmail={setApprovalEmail}
                  formName="asiatarkastus-hyvaksynta"
                  submitText="Hyväksy ja lähetä viesti"
                  heading="Loppuselvityksen hyväksyntä"
                  errorText={error}
                />
              ) : (
                <form onSubmit={onSubmitRiski}>
                  <div className="verification-footer">
                    <button type="submit" name="submit-verification" disabled={disableRiskiSubmit}>
                      Hyväksy asiatarkastus ja lähetä taloustarkastukseen
                    </button>
                    {error && <div className="error">{error}</div>}
                  </div>
                </form>
              )}
            </>
          )}
        </>
      )}
      {isAccepted && selvitysEmail && (
        <ViestiListaRow
          icon="done"
          virkailija={hakemus['loppuselvitys-taloustarkastanut-name'] || ''}
          date={hakemus['loppuselvitys-taloustarkastettu-at'] || ''}
          onClick={() => setShowHyvaksytty((show) => !show)}
          heading="Hyväksytty"
          dataTestId="loppuselvitys-asiatarkastus-hyvaksytty"
        >
          {showHyvaksytty && (
            <ViestiDetails
              message={{
                id: 0,
                sender: 'no-reply@valtionavustukset.oph.fi',
                reply_to: userInfo.email,
                receivers: selvitysEmail.to,
                message: selvitysEmail.message,
                subject: selvitysEmail.subject,
              }}
            />
          )}
        </ViestiListaRow>
      )}
    </>
  )
}

export function Asiatarkastus({ disabled }: { disabled: boolean }) {
  const hakemus = useHakemus()
  const avustushaku = useHakemustenArviointiSelector(
    (s) => getLoadedAvustushakuData(s.arviointi).hakuData.avustushaku
  )
  const otantatarkastusEnabled = avustushaku['loppuselvitys-otantatarkastus-enabled']
  const otantapolku = hakemus['loppuselvitys-otantapolku']
  const approvalKey = `${hakemus.id}-${hakemus['status-loppuselvitys']}`
  if (otantatarkastusEnabled && otantapolku === 'satunnaisotanta') {
    return <AsiatarkastusSatunnaisotanta key={approvalKey} disabled={disabled} />
  }
  if (otantatarkastusEnabled && otantapolku === 'otannan-ulkopuolella') {
    return <AsiatarkastusOtannanUlkopuolella key={approvalKey} disabled={disabled} />
  }
  return <Asiatarkastus2Vaiheinen key={approvalKey} disabled={disabled} />
}

export function PalautaAsiatarkastukseen() {
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const dispatch = useHakemustenArviointiDispatch()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const onDialogClose = () => {
    const dialog = dialogRef.current
    if (dialog?.returnValue === 'confirm') {
      palauta()
    }
    if (dialog) dialog.returnValue = ''
  }

  const palauta = async () => {
    setSubmitting(true)
    setError(undefined)
    try {
      await HttpUtil.post(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemus.id}/loppuselvitys/palauta-asiatarkastukseen`,
        {}
      )
      await dispatch(refreshHakemus({ hakemusId: hakemus.id }))
    } catch (e) {
      console.error('Failed to return loppuselvitys to asiatarkastus', e)
      const status = getHttpResponseErrorStatus(e)
      setError(
        status === 400
          ? 'Loppuselvitystä ei voi palauttaa asiatarkastukseen, päivitä sivu'
          : 'Palauttaminen asiatarkastukseen epäonnistui'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="palauta-asiatarkastukseen">
      <button
        name="palauta-asiatarkastukseen"
        disabled={submitting}
        onClick={() => dialogRef.current?.showModal()}
      >
        Palauta loppuselvitys asiatarkastukseen
      </button>
      <ConfirmDialog
        ref={dialogRef}
        title="Palauta loppuselvitys asiatarkastukseen"
        cancelLabel="Peruuta"
        confirmLabel="Palauta asiatarkastukseen"
        testId="palauta-asiatarkastukseen-modal"
        cancelTestId="palauta-asiatarkastukseen-cancel-button"
        confirmTestId="palauta-asiatarkastukseen-confirm-button"
        onClose={onDialogClose}
      >
        <p>Asiatarkastuksen tiedot tyhjennetään. Aiempi asiatarkastus jää näkyviin historiaan.</p>
      </ConfirmDialog>
      {error && <div className="error">{error}</div>}
    </div>
  )
}

function LoppuselvitysPalautukset() {
  const hakemus = useHakemus()
  const palautukset = hakemus.selvitys?.loppuselvitysPalautukset
  if (!palautukset?.length) return null
  return (
    <div data-test-id="loppuselvitys-palautukset">
      {palautukset.map((palautus) => (
        <React.Fragment key={palautus.id}>
          {palautus.information_verified_by && palautus.information_verified_at && (
            <AvattavaTarkastusRow
              name={palautus.information_verified_by}
              heading="Asiatarkastettu"
              date={palautus.information_verified_at}
              dataTestId="loppuselvitys-palautus-asiatarkastettu"
            >
              <AsiatarkastusContent verification={palautus.information_verification} />
            </AvattavaTarkastusRow>
          )}
          <ViestiListaStaticRow
            icon="undo"
            date={palautus.created_at}
            virkailija={palautus.user_name.trim()}
            heading="Palautettu asiatarkastukseen"
            dataTestId="loppuselvitys-palautus"
          />
        </React.Fragment>
      ))}
    </div>
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
  const {
    pending: orgEmailPending,
    currentOrgEmail,
    orgEmailFallback,
    orgEmailMissing,
  } = usePrependCurrentOrgEmailToReceivers(
    avustushaku.id,
    hakemus.id,
    setEmail,
    !isTaloustarkastettu,
    resolveOrgEmailFallback(
      getLoppuselvitysOrgEmail(hakemus),
      getValiselvitysOrgEmail(hakemus),
      getStoredOrgEmail(hakemus)
    )
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
            submitDisabled={orgEmailPending}
            warning={
              orgEmailFallback || orgEmailMissing
                ? getOrgEmailWarningMessage(currentOrgEmail ?? '')
                : undefined
            }
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
  showPalautukset?: boolean
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
  showPalautukset,
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
  const {
    pending: orgEmailPending,
    currentOrgEmail,
    orgEmailFallback,
    orgEmailMissing,
  } = usePrependCurrentOrgEmailToReceivers(
    avustushakuId,
    hakemus.id,
    setEmail,
    true,
    resolveOrgEmailFallback(
      getLoppuselvitysOrgEmail(hakemus),
      getValiselvitysOrgEmail(hakemus),
      getStoredOrgEmail(hakemus)
    )
  )
  const revealEmailForm = () => emailFormRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    setEmail(
      prependOrgEmailToReceivers(
        createInitialTaydennyspyyntoEmail(hakemus, avustushakuId, userInfo, hakijaServerUrl),
        currentOrgEmail
      )
    )
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
      {showPalautukset && <LoppuselvitysPalautukset />}
      {completedBy && (
        <AvattavaTarkastusRow
          name={completedBy.name}
          date={completedBy.date}
          heading={completedBy.heading}
          dataTestId="loppuselvitys-tarkastus"
        >
          {completedBy.component}
        </AvattavaTarkastusRow>
      )}
      {showEmailForm && (
        <MultipleRecipentEmailForm
          ref={emailFormRef}
          onSubmit={onSubmit}
          submitDisabled={orgEmailPending}
          warning={
            orgEmailFallback || orgEmailMissing
              ? getOrgEmailWarningMessage(currentOrgEmail ?? '')
              : undefined
          }
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
