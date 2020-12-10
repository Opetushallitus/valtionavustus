import React from 'react'
import moment from 'moment'

import './MuutoshakemusPaatos.less'

const paatosText = {
  'accepted': 'Opetushallitus hyväksyy muutokset hakemuksen mukaisesti.',
  'rejected': 'Opetushallitus hylkää muutoshakemuksen.',
  'accepted-with-changes': 'Opetushallitus hyväksyy hakemuksen alla olevin muutoksin.'
}

export const MuutoshakemusPaatos = ({ hakemus, muutoshakemus, paatos, presenter }) => {
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
      {paatos.status !== 'rejected' &&
      <section className="muutoshakemus-paatos__section">
        <div>Hyväksytyt muutokset</div>
        <div className="muutoshakemus-paatos__accepted-changes">
          <div>
            <h3 className="muutoshakemus-paatos__change-header">Vanha päättymisaika</h3>
            <div data-test-id="paatos-project-end">{hakemus['project-end']}</div>
          </div>
          <div>
            <h3 className="muutoshakemus-paatos__change-header">Hyväksytty muutos</h3>
            <div>{moment(muutoshakemus['haettu-kayttoajan-paattymispaiva']).format('D.M.YYYY')}</div>
          </div>
        </div>
      </section>
      }
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
