import moment from 'moment'
import React, { MouseEvent, useRef, useState } from 'react'

import { HelpTexts } from 'soresu-form/web/va/types'
import HttpUtil from 'soresu-form/web/HttpUtil'

import HelpTooltip from '../../common-components/HelpTooltip'
import { UserInfo, VaUserSearch } from '../../types'
import { DateInput } from './DateInput'
import { Maksatus } from './Maksatukset'
import { MaksatuksetTable } from './MaksatuksetTable'
import { useVaUserSearch } from '../../VaUserSearch'
import {
  VirkailijaAvustushaku,
  startSendingMaksatuksetAndTasmaytysraportti,
  startIndicatingThatSendingMaksatuksetAndTasmaytysraporttiFailed,
  stopSendingMaksatuksetAndTasmaytysraportti,
} from '../hakuReducer'
import { useHakujenHallintaDispatch, useHakujenHallintaSelector } from '../hakujenHallintaStore'
import { createDefaultErapaiva } from './erapaiva'

type LahtevatMaksatuksetProps = {
  avustushaku: VirkailijaAvustushaku
  helpTexts: HelpTexts
  payments: Maksatus[]
  refreshPayments: () => Promise<void>
  userInfo: UserInfo
}

type Document = {
  'acceptor-email': string
  'document-id': string
  phase: number
  'presenter-email': string
}

const now = moment()
const hasDocumentsForAllPhases = (phases: number[], documents: Document[]) => {
  for (const p of phases) {
    if (!documents.find((d) => d.phase === p)) {
      return false
    }
  }
  return true
}

type LoadingState = 'initial' | 'loading' | 'error'

const asetaMaksetuksiButtonText: Record<LoadingState, string> = {
  initial: 'Aseta maksetuksi',
  loading: 'Asetetaan...',
  error: 'Maksatusten asetus epäonnistui',
}

export const LahtevatMaksatukset = ({
  avustushaku,
  helpTexts,
  payments,
  refreshPayments,
  userInfo,
}: LahtevatMaksatuksetProps) => {
  const dispatch = useHakujenHallintaDispatch()
  const defaultLaskuAndTosite = (): Date => now.toDate()
  const [laskunPvm, setLaskunPvm] = useState<Date>(defaultLaskuAndTosite)
  const [erapaiva, setErapaiva] = useState<Date>(createDefaultErapaiva(now))
  const [tositePvm, setTositePvm] = useState<Date>(defaultLaskuAndTosite)
  const [documents, setDocuments] = useState<Document[]>([])
  const [asetaMaksatuksetState, setAsetaMaksatuksetState] = useState<LoadingState>('initial')
  const sendingMaksatuksetAndTasmaytysraportti = useHakujenHallintaSelector(
    (s) => !!s.haku.saveStatus.sendingMaksatuksetAndTasmaytysraportti
  )
  const phases = [...new Set(payments.map((p) => p.phase))]

  const errors = [
    !avustushaku['operational-unit-id'] ? 'Avustushaun toimintayksikkö puuttuu' : undefined,
    payments.some((p) => p['project-code'] === undefined)
      ? 'Projektikoodi puuttuu joltain hakemukselta'
      : undefined,
    !avustushaku.content['document-type'] ? 'Avustushaun tositelaji puuttuu' : undefined,
    payments.filter((p) => !p.hakemus?.['lkp-account']).length
      ? 'LKP-tili puuttuu joltain hakemukselta'
      : undefined,
    payments.filter((p) => !p.hakemus?.['takp-account']).length
      ? 'TaKP-tili puuttuu joltain hakemukselta'
      : undefined,
    !laskunPvm ? 'Laskun päivämäärä puuttuu' : undefined,
    !erapaiva ? 'Eräpäivä puuttuu' : undefined,
    !tositePvm ? 'Tositepäivämäärä puuttuu' : undefined,
    !hasDocumentsForAllPhases(phases, documents)
      ? 'Kaikille vaiheille ei ole lisätty asiakirjaa'
      : undefined,
  ].filter((e): e is string => e !== undefined)

  const createPaymentBatches = async () => {
    const body = {
      currency: 'EUR',
      'due-date': moment(erapaiva).format('YYYY-MM-DD'),
      'invoice-date': moment(laskunPvm).format('YYYY-MM-DD'),
      'receipt-date': moment(tositePvm).format('YYYY-MM-DD'),
      'grant-id': avustushaku.id,
      partner: '',
    }
    const { id } = await HttpUtil.post(`/api/v2/payment-batches/`, body)
    for (const d of documents) {
      await HttpUtil.post(`/api/v2/payment-batches/${id}/documents/`, d)
    }
    return id
  }

  const onLähetäMaksatuksetJaTäsmäytysraportti = async () => {
    try {
      dispatch(startSendingMaksatuksetAndTasmaytysraportti())
      const paymentBatchId = await createPaymentBatches()
      await HttpUtil.post(
        `/api/send-maksatukset-and-tasmaytysraportti/avustushaku/${avustushaku.id}/payments-batch/${paymentBatchId}`
      )
      dispatch(stopSendingMaksatuksetAndTasmaytysraportti())
      await refreshPayments()
    } catch (e) {
      dispatch(stopSendingMaksatuksetAndTasmaytysraportti())
      dispatch(startIndicatingThatSendingMaksatuksetAndTasmaytysraporttiFailed())
    }
  }

  const onAsetaMaksetuksi = async () => {
    setAsetaMaksatuksetState('loading')
    try {
      const id = await createPaymentBatches()
      await HttpUtil.put(`/api/v2/payment-batches/${id}/payments/`, {
        'paymentstatus-id': 'paid',
      })
      await refreshPayments()
    } catch (e) {
      setAsetaMaksatuksetState('error')
    }
  }
  const sending = asetaMaksatuksetState === 'loading' || sendingMaksatuksetAndTasmaytysraportti
  const disabled = !!errors.length || sending

  return (
    <>
      {!!payments.length && (
        <>
          {!!errors.length && (
            <div className="maksatukset_errors">
              <h2>Seuraavat puutteet estävät maksatusten lähetyksen</h2>
              <ul>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="maksatukset_paivamaarat">
            <div>
              <h3 className="required">
                Laskun päivämäärä
                <HelpTooltip
                  content={helpTexts['hakujen_hallinta__maksatus___laskun_päivämäärä']}
                  direction="left"
                />
              </h3>
              <DateInput
                id="laskun-pvm"
                defaultValue={laskunPvm}
                onChange={(_id, date) => setLaskunPvm(date.toDate())}
                allowEmpty={false}
                disabled={sending}
              />
            </div>
            <div data-test-id="eräpäivä">
              <h3 className="required">
                Eräpäivä
                <HelpTooltip
                  content={helpTexts['hakujen_hallinta__maksatus___eräpäivä']}
                  direction="left"
                />
              </h3>
              <DateInput
                id="erapaiva"
                defaultValue={erapaiva}
                onChange={(_id, date) => setErapaiva(date.toDate())}
                allowEmpty={false}
                disabled={sending}
              />
            </div>
            <div data-test-id="tosite-pvm">
              <h3 className="required">
                Tositepäivämäärä
                <HelpTooltip
                  content={helpTexts['hakujen_hallinta__maksatus___tositepäivämäärä']}
                  direction="left"
                />
              </h3>
              <DateInput
                id="tosite-pvm"
                defaultValue={tositePvm}
                onChange={(_id, date) => setTositePvm(date.toDate())}
                allowEmpty={false}
                disabled={sending}
              />
            </div>
          </div>
          <div className="maksatukset_documents">
            {phases.map((p) => (
              <DocumentEditor
                key={`phase-${p}`}
                avustushaku={avustushaku}
                documents={documents}
                helpTexts={helpTexts}
                phase={p}
                setDocuments={setDocuments}
                disabled={sending}
              />
            ))}
          </div>
          <button onClick={onLähetäMaksatuksetJaTäsmäytysraportti} disabled={disabled}>
            Lähetä maksatukset ja täsmäytysraportti
          </button>
          {userInfo.privileges.includes('va-admin') && (
            <>
              &nbsp;
              <button onClick={onAsetaMaksetuksi} disabled={disabled}>
                {asetaMaksetuksiButtonText[asetaMaksatuksetState]}
              </button>
            </>
          )}
          <div className="spacer" />
        </>
      )}
      <MaksatuksetTable payments={payments} testId="pending-payments-table" />
    </>
  )
}

type DocumentEditorProps = {
  avustushaku: VirkailijaAvustushaku
  documents: Document[]
  helpTexts: HelpTexts
  phase: number
  setDocuments: (d: Document[]) => void
  disabled: boolean
}

const DocumentEditor = ({
  avustushaku,
  documents,
  helpTexts,
  phase,
  setDocuments,
  disabled,
}: DocumentEditorProps) => {
  const currentDocument = documents.find((d) => d.phase === phase)
  const [ashaTunniste, setAshaTunniste] = useState(currentDocument?.['document-id'])
  const ashaRef = useRef<HTMLInputElement>(null)
  const [esittelija, setEsittelija] = useState(currentDocument?.['presenter-email'])
  const [_esittelijaSearch, setEsittelijaSearch, esittelijat] = useVaUserSearch()
  const esittelijaRef = useRef<HTMLInputElement>(null)
  const [hyvaksyja, setHyvaksyja] = useState(currentDocument?.['acceptor-email'])
  const hyvaksyjaRef = useRef<HTMLInputElement>(null)
  const [_hyvaksyjaSearch, setHyvaksyjaSearch, hyvaksyjat] = useVaUserSearch()

  const onDocumentEdit = () => {
    if (currentDocument) {
      setDocuments(documents.filter((d) => d.phase !== phase))
    } else if (hyvaksyja && ashaTunniste && esittelija) {
      setDocuments([
        ...documents,
        {
          'acceptor-email': hyvaksyja,
          'document-id': ashaTunniste,
          phase,
          'presenter-email': esittelija,
        },
      ])
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onDocumentEdit()
      }}
    >
      <div key={`document-${avustushaku.id}-${phase}`} className="maksatukset_document">
        <div>
          <h3>Vaihe</h3>
          <div className="maksatukset_document-phase">{phase + 1}. erä</div>
        </div>
        <div>
          <h3 className="required">
            ASHA-tunniste
            <HelpTooltip
              content={helpTexts['hakujen_hallinta__maksatus___asha-tunniste']}
              direction="left"
            />
          </h3>
          <input
            defaultValue={ashaTunniste}
            ref={ashaRef}
            onChange={(e) => {
              if (e.target.validity.patternMismatch) {
                ashaRef.current?.setCustomValidity('Tarkista ASHA-tunniste')
              } else {
                ashaRef.current?.setCustomValidity('')
              }
              setAshaTunniste(e.target.value)
            }}
            placeholder="Esim. ID1234567891"
            disabled={!!currentDocument}
            pattern={'^ID\\d{1,10}$'}
          />
        </div>
        <div className="maksatukset_email-field">
          <h3 className="required">
            Esittelijän sähköpostiosoite
            <HelpTooltip
              content={helpTexts['hakujen_hallinta__maksatus___esittelijän_sähköpostiosoite']}
              direction="left"
            />
          </h3>
          <input
            ref={esittelijaRef}
            defaultValue={esittelija}
            onChange={(e) => {
              setEsittelija(e.target.value)
              setEsittelijaSearch(e.target.value)
            }}
            disabled={!!currentDocument}
          />
          {!!esittelijat.result.results.length && (
            <SelectEmail
              userSearch={esittelijat}
              setSearch={setEsittelijaSearch}
              setEmail={setEsittelija}
              inputRef={esittelijaRef}
            />
          )}
        </div>
        <div className="maksatukset_email-field">
          <h3 className="required">
            Hyväksyjän sähköpostiosoite
            <HelpTooltip
              content={helpTexts['hakujen_hallinta__maksatus___hyväksyjän_sähköpostiosoite']}
              direction="left"
            />
          </h3>
          <input
            ref={hyvaksyjaRef}
            defaultValue={hyvaksyja}
            onChange={(e) => {
              setHyvaksyja(e.target.value)
              setHyvaksyjaSearch(e.target.value)
            }}
            disabled={!!currentDocument}
          />
          {!!hyvaksyjat.result.results.length && (
            <SelectEmail
              userSearch={hyvaksyjat}
              setSearch={setHyvaksyjaSearch}
              setEmail={setHyvaksyja}
              inputRef={hyvaksyjaRef}
            />
          )}
        </div>
        <div>
          <button
            type="submit"
            disabled={
              (!currentDocument && (!ashaTunniste || !esittelija || !hyvaksyja)) || disabled
            }
          >
            {!!currentDocument ? 'Poista asiakirja' : 'Lisää asiakirja'}
          </button>
        </div>
      </div>
    </form>
  )
}

type SelectEmailProps = {
  userSearch: VaUserSearch
  setSearch: (s: string) => void
  setEmail: (s: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

const SelectEmail = ({ userSearch, setSearch, setEmail, inputRef }: SelectEmailProps) => {
  const onClick = (email: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (inputRef.current) {
      inputRef.current.value = email
    }
    setEmail(email)
    setSearch('')
  }

  const results = userSearch.result.results.filter((r) => !!r.email)

  return (
    <div className="maksatukset_email-selector">
      {results.map((r) => (
        <div key={r.email}>
          <a onClick={onClick(r.email ?? '')}>{`${r['first-name']} ${r.surname} <${r.email}>`}</a>
        </div>
      ))}
    </div>
  )
}
