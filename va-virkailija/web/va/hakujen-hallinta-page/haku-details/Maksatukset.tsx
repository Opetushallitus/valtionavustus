import React, { useEffect, useState } from 'react'
import { partition } from 'lodash'
import moment from 'moment'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { fiShortFormat } from 'soresu-form/web/va/i18n/dateformat'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

import { HakemusV2WithEvaluation, PaymentBatchV2, PaymentV2, VaCodeValue } from '../../types'
import { LahtevatMaksatukset } from './LahtevatMaksatukset'

import './Maksatukset.css'
import { MaksatuksetTable } from './MaksatuksetTable'
import { useHakujenHallintaDispatch, useHakujenHallintaSelector } from '../hakujenHallintaStore'
import {
  completeManualSave,
  VirkailijaAvustushaku,
  startManuallySaving,
  selectLoadedInitialData,
} from '../hakuReducer'
import { tryToUseCurrentAvustushaku, useCurrentAvustushaku } from '../useAvustushaku'
import ChooseAvustushaku from './ChooseAvustushaku'

type MaksatuksetTab = 'outgoing' | 'sent'

export type Maksatus = PaymentV2 & {
  hakemus?: HakemusV2WithEvaluation
}

const isSent = (p: Maksatus) => ['sent', 'paid'].includes(p['paymentstatus-id'])
const today = moment().format(fiShortFormat)
const isToday = (p: Maksatus) => moment(p['created-at']).format(fiShortFormat) === today

const MaksatuksetPage = () => {
  const avustushaku = useCurrentAvustushaku()
  const {
    codeOptions: codeValues,
    environment,
    helpTexts,
    userInfo,
  } = useHakujenHallintaSelector(selectLoadedInitialData)
  const [tab, setTab] = useState<MaksatuksetTab>('outgoing')
  const [maksatukset, setMaksatukset] = useState<Maksatus[]>([])
  const [batches, setBatches] = useState<PaymentBatchV2[]>([])
  const [sentPayments, outgoingPayments] = partition(maksatukset, isSent)
  const newSentPayments = sentPayments.filter(isToday).length

  useEffect(() => {
    void refreshPayments()
  }, [avustushaku.id])

  const refreshPayments = async () => {
    const [hakemukset, payments, batches] = await Promise.all([
      HttpUtil.get<HakemusV2WithEvaluation[]>(
        `/api/v2/grants/${avustushaku.id}/applications/?template=with-evaluation`
      ),
      HttpUtil.get<PaymentV2[]>(`/api/v2/grants/${avustushaku.id}/payments/`),
      HttpUtil.get<PaymentBatchV2[]>(`/api/v2/grants/${avustushaku.id}/batches/`),
    ])
    setMaksatukset(
      payments.map((p) => {
        const hakemus = hakemukset.find(
          (h) => h.id === p['application-id'] && h.version === p['application-version']
        )
        return { ...p, hakemus }
      })
    )
    setBatches(batches)
  }

  return (
    <div className="maksatukset section-container">
      <AvustushakuInfo avustushaku={avustushaku} codeValues={codeValues} />
      <div className="maksatukset_tabs">
        <a
          className={`maksatukset_tab ${tab === 'outgoing' ? 'active' : ''}`}
          onClick={() => setTab('outgoing')}
        >
          Lähtevät maksatukset
        </a>
        <a
          className={`maksatukset_tab ${tab === 'sent' ? 'active' : ''}`}
          onClick={() => setTab('sent')}
        >
          Lähetetyt maksatukset
          {newSentPayments ? (
            <span className="maksatukset_badge">{newSentPayments} uutta</span>
          ) : (
            ''
          )}
        </a>
      </div>
      {tab === 'sent' ? (
        <>
          <MaksatuseräTable
            batches={batches}
            payments={sentPayments}
            testId="maksatukset-table-batches"
          />
          <MaksatuksetTable payments={sentPayments} testId="maksatukset-table-payments" />
          <div className="maksatukset_report">
            <a target="_blank" href={`/api/v2/reports/tasmaytys/avustushaku/${avustushaku.id}`}>
              Lataa täsmäytysraportti
            </a>
          </div>
        </>
      ) : (
        <LahtevatMaksatukset
          avustushaku={avustushaku}
          helpTexts={helpTexts}
          payments={outgoingPayments}
          refreshPayments={refreshPayments}
          userInfo={userInfo}
        />
      )}
      {userInfo.privileges.includes('va-admin') && (
        <AdminTools
          avustushaku={avustushaku}
          environment={environment}
          refreshPayments={refreshPayments}
        />
      )}
    </div>
  )
}

const AvustushakuInfo = ({
  avustushaku,
  codeValues,
}: {
  avustushaku: VirkailijaAvustushaku
  codeValues: VaCodeValue[]
}) => {
  return (
    <div className="maksatukset_avustushaku">
      <h2>{avustushaku.content.name.fi}</h2>
      <div className="maksatukset_avustushaku-info">
        <div>
          <label>Toimintayksikkö</label>
          <div>{codeValues.find((c) => c.id === avustushaku['operational-unit-id'])?.code}</div>
        </div>
        <div>
          <label>Maksuliikemenotili</label>
          <div>{avustushaku.content['transaction-account']}</div>
        </div>
        <div>
          <label>Tositelaji</label>
          <div>{avustushaku.content['document-type']}</div>
        </div>
      </div>
    </div>
  )
}

type MaksatuseräTable = {
  batches: PaymentBatchV2[]
  payments: Maksatus[]
  testId: string
}

const MaksatuseräTable = ({ batches, payments, testId }: MaksatuseräTable) => {
  let i = 0
  return (
    <>
      <table className="maksatukset_payments-table" data-test-id={testId}>
        <thead>
          <tr>
            <th>Vaihe</th>
            <th>Yhteensä</th>
            <th>Maksatuksia</th>
            <th>Laskupvm</th>
            <th>Eräpvm</th>
            <th>Tositepäivä</th>
            <th>Allekirjoitettu yhteenveto</th>
            <th>Esittelijän sähköpostiosoite</th>
            <th>Hyväksyjän sähköpostiosoite</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <React.Fragment key={b.id}>
              {b.documents.map((d) => {
                const batchPayments = payments.filter(
                  (p) => p['batch-id'] === b.id && p.phase === d.phase
                )
                return (
                  <tr key={d.phase} className={i % 2 === 0 ? 'white' : 'gray'}>
                    <td>{d.phase + 1}. erä</td>
                    <td>{batchPayments.reduce((a, c) => a + c['payment-sum'], 0)}</td>
                    <td>{batchPayments.length}</td>
                    <td>{moment(b['invoice-date']).format(fiShortFormat)}</td>
                    <td>{moment(b['due-date']).format(fiShortFormat)}</td>
                    <td>{moment(b['receipt-date']).format(fiShortFormat)}</td>
                    <td>{d['document-id']}</td>
                    <td>{d['presenter-email']}</td>
                    <td>{d['acceptor-email']}</td>
                  </tr>
                )
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {batches.length === 0 && <div className="maksatukset_no-payments">Ei maksueriä</div>}
    </>
  )
}

type AdminToolsProps = {
  avustushaku: VirkailijaAvustushaku
  environment: EnvironmentApiResponse
  refreshPayments: () => Promise<void>
}

const AdminTools = ({ avustushaku, environment, refreshPayments }: AdminToolsProps) => {
  const dispatch = useHakujenHallintaDispatch()
  const onPoistaMaksatukset = async () => {
    const really = window.confirm('Oletko varma, että haluat poistaa kaikki haun maksatukset?')
    if (really) {
      dispatch(startManuallySaving())
      await HttpUtil.delete(`/api/v2/grants/${avustushaku.id}/payments/`)
      await refreshPayments()
      dispatch(completeManualSave())
    }
  }

  const onLuoMaksatukset = async () => {
    dispatch(startManuallySaving())
    await HttpUtil.post(`/api/v2/grants/${avustushaku.id}/payments/`, {
      phase: 0,
    })
    await refreshPayments()
    dispatch(completeManualSave())
  }

  return (
    <div>
      <hr className="spacer" />
      <h2>Pääkäyttäjän työkalut</h2>
      <button onClick={onLuoMaksatukset}>Luo maksatukset</button>
      {environment.payments['delete-payments?'] && (
        <>
          &nbsp;
          <button onClick={onPoistaMaksatukset}>Poista maksatukset</button>
        </>
      )}
    </div>
  )
}

export const Maksatukset = () => {
  const avustushaku = tryToUseCurrentAvustushaku()
  if (!avustushaku) {
    return <ChooseAvustushaku />
  }
  return <MaksatuksetPage />
}
