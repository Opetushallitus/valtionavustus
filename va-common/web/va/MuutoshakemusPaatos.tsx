import React from 'react'
import moment from 'moment'

import {
  getProjectEndDate,
  getTalousarvio,
  isAcceptedWithChanges,
  isRejected
} from './Muutoshakemus'
import { TalousarvioTable } from './muutoshakemus/MuutosTaloudenKayttosuunnitelmaan'
import { useTranslations } from 'va-common/web/va/i18n/TranslationContext'
import { fiShortFormat } from 'va-common/web/va/i18n/dateformat'
import {Paatos, PaatosState} from "./types/muutoshakemus";

import './MuutoshakemusPaatos.less'
import {Role} from "../../../va-virkailija/web/va/types";

type MuutoshakemusPaatosProps = Omit<PaatosState, 'paatos' | 'presenter'> & {
  paatos: Omit<Paatos, 'id' | 'user-key' | 'updated-at'>
  presenter: Role | undefined
}

type HyvaksytytMuutoksetProps = Omit<MuutoshakemusPaatosProps, 'presenter' | 'isPresentingOfficer'>

const HyvaksytytMuutokset = ({ hakemus, muutoshakemus, paatos, avustushaku, muutoshakemukset }: HyvaksytytMuutoksetProps) => {
  if (isRejected(paatos.status)) return null
  const { t } = useTranslations()

  const acceptedWithChanges = isAcceptedWithChanges(paatos.status)
  const paattymispaiva = acceptedWithChanges ? paatos.paattymispaiva : muutoshakemus['haettu-kayttoajan-paattymispaiva']
  const newTalousarvio = acceptedWithChanges ? (paatos.talousarvio || []) : muutoshakemus.talousarvio

  const projectEndDate = getProjectEndDate(avustushaku, muutoshakemukset, muutoshakemus)
  const currentTalousarvio = getTalousarvio(muutoshakemukset, hakemus && hakemus.talousarvio, muutoshakemus)

  return (
    <section className="muutoshakemus-paatos__section">
      <div data-test-id="accepted-changes-title">{t.muutoshakemus.acceptedChanges}</div>
      <div data-test-id="accepted-changes-content">
        {!!newTalousarvio.length && <TalousarvioTable paatos={true} currentTalousarvio={currentTalousarvio} newTalousarvio={newTalousarvio} status={paatos.status} />}
        {muutoshakemus['haen-kayttoajan-pidennysta'] &&
          <div className="muutoshakemus-paatos__jatkoaika">
            <div>
              <h3 className="muutoshakemus-paatos__change-header" data-test-id="h-old-end-date">{t.muutoshakemus.previousProjectEndDate}</h3>
              <div data-test-id="paatos-project-end">{projectEndDate}</div>
            </div>
            <div>
              <h3 className="muutoshakemus-paatos__change-header" data-test-id="h-new-end-date">{t.muutoshakemus.acceptedChange}</h3>
              <div data-test-id="paattymispaiva-value">{moment(paattymispaiva).format(fiShortFormat)}</div>
            </div>
          </div>
        }
        {muutoshakemus['haen-sisaltomuutosta'] && (
          <div className="muutoshakemus-paatos__sisaltomuutos">
            <h3 className="muutoshakemus-paatos__change-header">{t.sisaltomuutos.acceptedChanges}</h3>
            <div>{paatos['hyvaksytyt-sisaltomuutokset']}</div>
          </div>
        )}
      </div>
    </section>
  )
}

export const MuutoshakemusPaatos = ({ hakemus, muutoshakemus, paatos, presenter, avustushaku, muutoshakemukset, isPresentingOfficer }: MuutoshakemusPaatosProps) => {
  const { t } = useTranslations()

  return (
    <div className="muutoshakemus-paatos__content">
      <header className="muutoshakemus-paatos__header">
        <img id="logo" src="/img/logo.png" height="50" alt={t.logo.alt} />
        <div><span data-test-id="muutoshakemus-paatos-title">{t.muutoshakemus.paatos.paatos}</span><br/>
          {moment(paatos['created-at']).format(fiShortFormat)}
        </div>
        <div data-test-id="paatos-register-number">{hakemus['register-number']}</div>
      </header>
      <h1 className="muutoshakemus-paatos__org">{hakemus['organization-name']}</h1>
      <section className="muutoshakemus-paatos__section">
        <div data-test-id="muutospaatos-asia-title">{t.muutoshakemus.paatos.asia}</div>
        <div data-test-id="muutospaatos-asia-content">
          <div className="muutoshakemus-paatos__project-name">
            {t.muutoshakemus.paatos.hanke}: <i data-test-id="paatos-project-name">{hakemus['project-name']}</i>
          </div>
          {muutoshakemus.talousarvio && !!muutoshakemus.talousarvio.length && (
            <div data-test-id="budget-change">{t.muutoshakemus.paatos.muutoshakemusTaloudenKayttosuunnitelmaan}</div>
          )}
          {muutoshakemus['haen-kayttoajan-pidennysta'] && (
            <div data-test-id="jatkoaika-asia">{t.muutoshakemus.paatos.hakemusKayttoajanPidennykselle}</div>
          )}
          {muutoshakemus['haen-sisaltomuutosta'] && (
            <div>{t.muutoshakemus.paatos.muutoshakemusSisaltoonTaiToteutustapaan}</div>
          )}
        </div>
      </section>
      <section className="muutoshakemus-paatos__section">
        <div data-test-id="muutoshakemus-paatos-section-title">{t.muutoshakemus.paatos.paatos}</div>
        <div data-test-id="paatos-paatos">{t.muutoshakemus.paatos.status[paatos.status]}</div>
      </section>

      <HyvaksytytMuutokset
        hakemus={hakemus}
        muutoshakemus={muutoshakemus}
        muutoshakemukset={muutoshakemukset}
        paatos={paatos}
        avustushaku={avustushaku} />

      <section className="muutoshakemus-paatos__section">
        <div data-test-id="muutoshakemus-paatos-perustelut-title">{t.muutoshakemus.paatos.perustelut}</div>
        <div className="muutoshakemus-paatos__reason" data-test-id="paatos-reason">{paatos.reason}</div>
      </section>
      <section className="muutoshakemus-paatos__section">
        <div data-test-id="muutoshakemus-paatos-tekija-title">{t.muutoshakemus.paatos.paatoksenTekija}</div>
        {isPresentingOfficer
          ? <div data-test-id="paatos-decider">{paatos.decider}</div>
          : <div>
              <div data-test-id="paatos-decider">{paatos.decider}</div>
              <br/>
              <div data-test-id="muutoshakemus-paatos-esittelija-title">{t.muutoshakemus.paatos.esittelija}</div>
              <div data-test-id="paatos-esittelija">
                {presenter?.name}
              </div>
            </div>
        }
      </section>
      <section className="muutoshakemus-paatos__section">
        <div data-test-id="muutoshakemus-paatos-lisatietoja-title">{t.muutoshakemus.paatos.lisatietoja}</div>
        <div data-test-id="paatos-additional-info">
          {presenter?.name}<br/>
          {presenter?.email}<br/>
          {t.muutoshakemus.paatos.phoneNumber}
        </div>
      </section>
    </div>
  )
}
