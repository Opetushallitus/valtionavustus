import React from 'react'
import moment from 'moment'

import { getProjectEndDate, getTalousarvio } from './Muutoshakemus'
import { TalousarvioTable } from './muutoshakemus/MuutosTaloudenKayttosuunnitelmaan'

import './MuutoshakemusPaatos.less'

const paatosText = {
  'accepted': 'Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.',
  'rejected': 'Opetushallitus hylkää muutoshakemuksen.',
  'accepted_with_changes': 'Opetushallitus hyväksyy hakemuksen alla olevin muutoksin.'
}

const HyvaksytytMuutokset = ({ hakemus, muutoshakemus, paatos, avustushaku, muutoshakemukset }) => {
  if (paatos.status === 'rejected') return null

  const isAcceptedWithChanges = paatos.status === 'accepted_with_changes'
  const paattymispaiva = isAcceptedWithChanges ? paatos.paattymispaiva : muutoshakemus['haettu-kayttoajan-paattymispaiva']
  const newTalousarvio = isAcceptedWithChanges ? paatos.talousarvio : muutoshakemus.talousarvio

  const previousMuutoshakemus = muutoshakemukset.filter(i => i["created-at"] < muutoshakemus["created-at"])
  const projectEndDate = getProjectEndDate(avustushaku, previousMuutoshakemus)
  const currentTalousarvio = getTalousarvio(previousMuutoshakemus, hakemus)

  return (
    <section className="muutoshakemus-paatos__section">
      <div>Hyväksytyt muutokset</div>
      <div>
        {newTalousarvio.length && <TalousarvioTable paatos={true} currentTalousarvio={currentTalousarvio} newTalousarvio={newTalousarvio} status={paatos.status} lang="fi" />}
        {muutoshakemus['haen-kayttoajan-pidennysta'] &&
          <div className="muutoshakemus-paatos__accepted-changes">
            <div>
              <h3 className="muutoshakemus-paatos__change-header" data-test-id="h-old-end-date">Vanha päättymisaika</h3>
              <div data-test-id="paatos-project-end">{projectEndDate}</div>
            </div>
            <div>
              <h3 className="muutoshakemus-paatos__change-header" data-test-id="h-new-end-date">Hyväksytty muutos</h3>
              <div data-test-id="paattymispaiva-value">{moment(paattymispaiva).format('D.M.YYYY')}</div>
            </div>
          </div>
        }
      </div>
    </section>
  )
}

export const MuutoshakemusPaatos = ({ hakemus, muutoshakemus, paatos, presenter, avustushaku, muutoshakemukset }) => {
  return (
    <div className="muutoshakemus-paatos__content">
      <header className="muutoshakemus-paatos__header">
        <img id="logo" src="/img/logo.png" height="50" alt="Opetushallitus / Utbildningsstyrelsen" />
        <div>
          Päätös<br/>
          {moment(paatos['created-at']).format('D.M.YYYY')}
        </div>
        <div data-test-id="paatos-register-number">{hakemus['register-number']}</div>
      </header>
      <h1 className="muutoshakemus-paatos__org">{hakemus['organization-name']}</h1>
      <section className="muutoshakemus-paatos__section">
        <div>Asia</div>
        <div>
          <div className="muutoshakemus-paatos__project-name">Hanke: <i data-test-id="paatos-project-name">{hakemus['project-name']}</i></div>
          {muutoshakemus['haen-kayttoajan-pidennysta'] && <div>Hakemus avustuksen käyttöajan pidennykselle.</div>}
        </div>
      </section>
      <section className="muutoshakemus-paatos__section">
        <div>Päätös</div>
        <div data-test-id="paatos-paatos">{paatosText[paatos.status]}</div>
      </section>

      <HyvaksytytMuutokset
        hakemus={hakemus}
        muutoshakemus={muutoshakemus}
        muutoshakemukset={muutoshakemukset}
        paatos={paatos}
        avustushaku={avustushaku} />

      <section className="muutoshakemus-paatos__section">
        <div>Päätöksen perustelut</div>
        <div className="muutoshakemus-paatos__reason" data-test-id="paatos-reason">{paatos.reason}</div>
      </section>
      <section className="muutoshakemus-paatos__section">
        <div>Päätöksen tekijä</div>
        <div data-test-id="paatos-decider">
          {paatos.decider}
          {paatos.decider !== presenter.name
            ? <div className="muutoshakemus-paatos__presenter">
                Esittelijä<br/>
                {presenter.name}
              </div>
            : ''
          }
        </div>
      </section>
      <section className="muutoshakemus-paatos__section">
        <div>Lisätietoja</div>
        <div data-test-id="paatos-additional-info">
          {presenter.name}<br/>
          {presenter.email}<br/>
          029 533 1000 (vaihde)
        </div>
      </section>
    </div>
  )
}
