import React from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import moment from 'moment'
import { DateTimePicker } from 'react-widgets'
import momentLocalizer from 'react-widgets-moment'


import HttpUtil from 'soresu-form/web/HttpUtil'
import { MuutoshakemusPaatos } from 'va-common/web/va/MuutoshakemusPaatos'

import { copyToClipboard } from '../copyToClipboard'
import { isSubmitDisabled, isError } from '../formikHelpers'
import { Modal } from './Modal'

import './Muutoshakemus.less'

moment.locale('fi')
momentLocalizer()

const defaultReasonAccepted = 'Opetushallitus katsoo, että päätöksessä hyväksytyt muutokset tukevat hankkeen tavoitteiden saavuttamista.'
const defaultReasonRejected = 'Opetushallitus on arvioinut hakemuksen. Asiantuntija-arvioinnin perusteella on Opetushallitus asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.'

const paatosStatuses = [
  { value: 'accepted', text: 'Hyväksytään', defaultReason: defaultReasonAccepted },
  { value: 'accepted_with_changes', text: 'Hyväksytään muutettuna', defaultReason: defaultReasonAccepted },
  { value: 'rejected', text: 'Hylätään', defaultReason: defaultReasonRejected }
]

const PaatosSchema = Yup.object().shape({
  status: Yup.string()
    .oneOf(paatosStatuses.map(s => s.value))
    .required(),
  reason: Yup.string()
    .required('Perustelu on pakollinen kenttä'),
  paattymispaiva: Yup.date().when('status', {
    is: 'accepted_with_changes',
    then: (s) => s.required('Päättymispäivä on pakollinen kenttä'),
  })
})

function formToPayload(values) {
  if (!values.paattymispaiva) return values

  return {
    ...values,
    paattymispaiva: moment(values.paattymispaiva).format('YYYY-MM-DD')
  }
}

export const MuutoshakemusForm = ({ avustushaku, muutoshakemus, hakemus, controller, userInfo, presenter }) => {
  const f = useFormik({
    initialValues: {
      status: 'accepted',
      reason: '',
      paattymispaiva: undefined,
    },
    validationSchema: PaatosSchema,
    onSubmit: async (values) => {
      const storedPaatos = await HttpUtil.post(`/api/avustushaku/${avustushaku.id}/hakemus/${hakemus['hakemus-id']}/muutoshakemus/${muutoshakemus.id}/paatos`, formToPayload(values))
      controller.setPaatos({ muutoshakemusId: muutoshakemus.id, hakemusId: hakemus['hakemus-id'], ...storedPaatos })
    }
  })

  const paatosStatusRadioButton = ({ value, text }) => {
    return (
      <React.Fragment key={`paatos-status-${value}`}>
        <input id={value} name="status" type="radio" value={value} onChange={f.handleChange} checked={f.values.status === value} />
        <label htmlFor={value}>{text}</label>
      </React.Fragment>
    )
  }

  const ErrorMessage = (text) => {
    return <span className="muutoshakemus__error-message">{text || ' '}</span>
  }

  const voimassaolevaPaattymisaika = () => {
    const haettuPaiva = hakemus['haettu-kayttoajan-paattymispaiva']

    return (
      <section className="muutoshakemus-section">
        <div className="muutoshakemus-row muutoshakemus__project-end-row">
          <div>
            <h3 className="muutoshakemus__header">Voimassaoleva päättymisaika</h3>
            <div>{hakemus['project-end']}</div>
          </div>
          <div>
            <h3 className="muutoshakemus__header">Haettu muutos</h3>
            <div data-test-id="approve-with-changes-muutoshakemus-jatkoaika">
              {moment(haettuPaiva).format('DD.MM.YYYY')}
            </div>
          </div>
          <div>
            <h3 className="muutoshakemus__header">OPH:n hyväksymä</h3>
            <div id="approve-with-changes-muutoshakemus-jatkoaika-oph">
              <DateTimePicker
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
                defaultValue={f.values['paattymispaiva'] || haettuPaiva}
                containerClassName={`datepicker`}
                time={false} />
            </div>
            {isError(f, 'paattymispaiva') && <div className="muutoshakemus__error">Päättymispäivä on pakollinen kenttä!</div>}
          </div>
        </div>
      </section>
  )}

  const onPaatosPreviewClick = () => {
    const paatos = {
      'created-at': new Date(),
      decider: `${userInfo['first-name']} ${userInfo['surname']}`,
      ...f.values
    }
    controller.setModal(
      <Modal title="ESIKATSELU" controller={controller}>
        <MuutoshakemusPaatos paatos={paatos} muutoshakemus={muutoshakemus} hakemus={hakemus} presenter={presenter} />
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
        {isAcceptedWithChanges(f) && voimassaolevaPaattymisaika()}
        <div className="muutoshakemus-row">
          <h4 className="muutoshakemus__header">
            Perustelut <a className="muutoshakemus__default-reason-link" onClick={() => setDefaultReason(f)}>Lisää vakioperustelu</a>
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

function setDefaultReason(f) {
  const status = paatosStatuses.find(_ => _.value === f.values.status)
  f.setFieldValue('reason', status.defaultReason)
}
