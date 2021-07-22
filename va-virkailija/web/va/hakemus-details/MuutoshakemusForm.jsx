import React from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import moment from 'moment'
import DatePicker from 'react-widgets/DatePicker'
import MomentLocalizer from 'react-widgets-moment'
import Localization from 'react-widgets/Localization'
import { omit } from 'lodash'
import { translations, translationsFi } from 'va-common/web/va/i18n/translations'
import { TranslationContext, getTranslationContext } from 'va-common/web/va/i18n/TranslationContext'
import { isoFormat, parseDateString } from 'va-common/web/va/i18n/dateformat'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { MuutoshakemusPaatos } from 'va-common/web/va/MuutoshakemusPaatos'
import {
  toFinnishDateFormat,
  dateStringToMoment,
  getTalousarvioSchema,
  getTalousarvioValues,
  getTalousarvio
} from 'va-common/web/va/Muutoshakemus'

import { copyToClipboard } from '../copyToClipboard'
import { isSubmitDisabled, isError } from '../formikHelpers'
import { Modal } from './Modal'
import { TalousarvioAcceptWithChangesForm } from './TalousarvioAcceptWithChangesForm'
import { HyväksytytSisältömuutoksetForm } from './HyväksytytSisältömuutoksetForm'

import './Muutoshakemus.less'

moment.locale('fi')
const localizer = new MomentLocalizer(moment)

const paatosStatuses = [
  {
    value: 'accepted',
    text: 'Hyväksytään',
    defaultReason: {
      fi: translations.fi.muutoshakemus.paatos.vakioperustelut.accepted,
      sv: translations.sv.muutoshakemus.paatos.vakioperustelut.accepted,
    }
  },
  {
    value: 'accepted_with_changes',
    text: 'Hyväksytään muutettuna',
    defaultReason: {
      fi: translations.fi.muutoshakemus.paatos.vakioperustelut.accepted_with_changes,
      sv: translations.sv.muutoshakemus.paatos.vakioperustelut.accepted_with_changes,
    }
  },
  {
    value: 'rejected',
    text: 'Hylätään',
    defaultReason: {
      fi: translations.fi.muutoshakemus.paatos.vakioperustelut.rejected,
      sv: translations.sv.muutoshakemus.paatos.vakioperustelut.rejected,
    }
  }
]

const errors = {
  required: 'Pakollinen kenttä',
  talousarvioSum: sum => `Loppusumman on oltava ${sum}`
}

const getPaatosSchema = (muutoshakemus) => Yup.object().shape({
  status: Yup.string()
    .oneOf(paatosStatuses.map(s => s.value))
    .required(),
  reason: Yup.string()
    .required('Perustelu on pakollinen kenttä'),
  talousarvio: Yup.lazy(talousarvio => talousarvio ? Yup.object(getTalousarvioSchema(talousarvio, errors)) : Yup.object()),
  paattymispaiva: Yup.date().when('status', {
    is: 'accepted_with_changes',
    then: muutoshakemus['haen-kayttoajan-pidennysta'] ? Yup.date().required('Päättymispäivä on pakollinen kenttä') : Yup.date(),
  }),
  'hyvaksytyt-sisaltomuutokset': Yup.string().when('status', {
    is: value => value !== 'rejected',
    then: muutoshakemus['haen-sisaltomuutosta'] ? Yup.string().required('Kuvaile hyväksytyt muutokset hankkeen sisältöön tai toteutustapaan on pakollinen kenttä!') : Yup.string(),
  })
})

function formToPayload(values) {
  return {
    ...values,
    'hyvaksytyt-sisaltomuutokset': values.status !== 'rejected' ? values['hyvaksytyt-sisaltomuutokset'] : undefined,
    talousarvio: values.talousarvio && omit(values.talousarvio, ['currentSum', 'originalSum']),
    paattymispaiva: values.paattymispaiva && moment(values.paattymispaiva).format(isoFormat)
  }
}

export const MuutoshakemusForm = ({ avustushaku, muutoshakemus, hakemus, hakemusVersion, controller, userInfo, presenter, projectEndDate, muutoshakemukset, isPresentingOfficer }) => {
  const talousarvioValues = muutoshakemus.talousarvio.length ? getTalousarvioValues(muutoshakemus.talousarvio) : undefined
  const talousarvio = getTalousarvio(muutoshakemukset, hakemus.talousarvio)
  const f = useFormik({
    initialValues: {
      status: 'accepted',
      reason: '',
      paattymispaiva: undefined,
      'hyvaksytyt-sisaltomuutokset': undefined,
      talousarvio: talousarvioValues,
    },
    validationSchema: getPaatosSchema(muutoshakemus),
    onSubmit: async (values) => {
      const payload = formToPayload(values)
      const storedPaatos = await HttpUtil.post(`/api/avustushaku/${avustushaku.id}/hakemus/${hakemus['hakemus-id']}/muutoshakemus/${muutoshakemus.id}/paatos`, payload)
      controller.setPaatos({ muutoshakemusId: muutoshakemus.id, hakemusId: hakemus['hakemus-id'], ...storedPaatos })
    }
  })

  const paatosStatusRadioButton = ({ value, text }) => {
    const handleChange = e => {
      if (talousarvioValues) {
        f.setFieldValue('talousarvio', talousarvioValues, true)
      }
      f.handleChange(e)
    }

    return (
      <React.Fragment key={`paatos-status-${value}`}>
        <input id={value} name="status" type="radio" value={value} onChange={handleChange} checked={f.values.status === value} />
        <label htmlFor={value}>{text}</label>
      </React.Fragment>
    )
  }

  const Error = () => {
    if (!isError(f, 'paattymispaiva')) return null

    return (
      <span className="muutoshakemus__error row3 col3">Päättymispäivä on pakollinen kenttä!</span>
    )
  }

  const käyttöajanPidennysAcceptWithChangesForm = () => {
    const haettuPaiva = dateStringToMoment(muutoshakemus['haettu-kayttoajan-paattymispaiva'])

    return (
      <div className="muutoshakemus-row muutoshakemus__project-end-row muutoshakemus__accept-with-changes">

        <h3 className="muutoshakemus__header row1 col1">Voimassaoleva päättymisaika</h3>
        <div data-test-id="current-project-end-date" className="row2 col1">{projectEndDate}</div>


        <h3 className="muutoshakemus__header row1 col2">Haettu muutos</h3>
        <div data-test-id="approve-with-changes-muutoshakemus-jatkoaika" className="row2 col2">
          {toFinnishDateFormat(haettuPaiva)}
        </div>


        <h3 className="muutoshakemus__header row1 col3">OPH:n hyväksymä</h3>
        <div id="approve-with-changes-muutoshakemus-jatkoaika-oph" className="row2 col3 calendar">
          <Localization date={localizer} messages={translationsFi.calendar}>
            <DatePicker
              name="paattymispaiva"
              onBlur={() => f.setFieldTouched('paattymispaiva')}
              onChange={(newDate) => {
                const d = moment(newDate)
                if (d.isValid()) {
                  f.setFieldValue('paattymispaiva', newDate)
                } else {
                  f.setFieldValue('paattymispaiva', undefined)
                }
              }}
              parse={parseDateString}
              defaultValue={f.values['paattymispaiva'] || haettuPaiva.toDate()}
              containerClassName={`datepicker ${isError(f, 'paattymispaiva') ? 'muutoshakemus__error' : ''}`} />
          </Localization>
        </div>
        <Error />
      </div>
  )}

  const onPaatosPreviewClick = () => {
    const paatos = {
      'created-at': new Date(),
      decider: `${userInfo['first-name']} ${userInfo['surname']}`,
      ...f.values,
      talousarvio: muutoshakemus.talousarvio.map(meno => ({ ...meno, amount: f.values.talousarvio[meno.type] }))
    }
    controller.setModal(
      <Modal title="ESIKATSELU" controller={controller}>
        <TranslationContext.Provider value={getTranslationContext(hakemusVersion.language)}>
        <MuutoshakemusPaatos
          avustushaku={avustushaku}
          paatos={paatos}
          muutoshakemus={muutoshakemus}
          hakemus={hakemus}
          presenter={presenter}
          isPresentingOfficer={isPresentingOfficer}
          muutoshakemukset={muutoshakemukset} />
        </TranslationContext.Provider>
      </Modal>
    )
  }

  return (
    <form onSubmit={f.handleSubmit} data-test-id="muutoshakemus-form">
      <section className="muutoshakemus-section">
        <div className="muutoshakemus-row">
          <h3 className="muutoshakemus__header">Päätös</h3>
          <div className="muutoshakemus__copy-link-row">
            <div className="muutoshakemus__copy-link-text">Jos päätös tarvitsee päällikön hyväksynnän, pyydä häntä katsomaan hakemus ja tekemään päätös.</div>
            <a onClick={() => copyToClipboard(window.location.href)}>Kopioi leikepöydälle linkki hakemukseen</a>
          </div>
        </div>
        <div className="muutoshakemus-row">
          <h4 className="muutoshakemus__header">Muutoshakemus</h4>
          <fieldset className="soresu-radiobutton-group">
            {paatosStatuses.map(paatosStatusRadioButton)}
          </fieldset>
        </div>
        {isAcceptedWithChanges(f) && (
          <React.Fragment>
            {!!muutoshakemus.talousarvio.length && <TalousarvioAcceptWithChangesForm f={f} talousarvio={talousarvio} requestedTalousarvio={muutoshakemus.talousarvio} />}
            {muutoshakemus['haen-kayttoajan-pidennysta'] && käyttöajanPidennysAcceptWithChangesForm()}
          </React.Fragment>
        )}
        {(!isRejected(f) && muutoshakemus['haen-sisaltomuutosta']) &&
          <HyväksytytSisältömuutoksetForm f={f} muutoshakemus={muutoshakemus} />}
        <div className="muutoshakemus-row">
          <h4 className="muutoshakemus__header">
            Perustelut <span className="muutoshakemus__default-reason-link"><a onClick={() => setDefaultReason(f, 'fi')}>Lisää vakioperustelu suomeksi</a> | <a onClick={() => setDefaultReason(f, 'sv')}>Lisää vakioperustelu ruotsiksi</a></span>
          </h4>
          <textarea id="reason" name="reason" rows="5" cols="53" onChange={f.handleChange} onBlur={f.handleBlur} value={f.values.reason} className={isError(f, 'reason') && "muutoshakemus__error"} />
          {isError(f, 'reason') && <div className="muutoshakemus__error">Perustelu on pakollinen kenttä!</div>}
        </div>
        <div className="muutoshakemus-row muutoshakemus__preview-row">
          <a className="muutoshakemus__paatos-preview-link" onClick={onPaatosPreviewClick}>Esikatsele päätösdokumentti</a>
        </div>
        <div className="muutoshakemus-row">
          <button type="submit" disabled={isSubmitDisabled(f)} data-test-id="muutoshakemus-submit">Tee päätös ja lähetä hakijalle</button>
        </div>
      </section>
    </form>
  )
}

function isAcceptedWithChanges(formik) {
  return formik.values.status === 'accepted_with_changes'
}

function isRejected(formik) {
  return formik.values.status === 'rejected'
}

function setDefaultReason(f, lang) {
  const status = paatosStatuses.find(_ => _.value === f.values.status)
  f.setFieldValue('reason', status.defaultReason[lang])
}
