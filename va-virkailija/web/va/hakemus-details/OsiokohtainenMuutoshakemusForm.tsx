import {
  Avustushaku, Hakemus,
  NormalizedHakemusData, UserInfo
} from "../../../../va-common/web/va/types";
import {
  Muutoshakemus,
  Presenter, Talousarvio, TalousarvioValues,
} from "../../../../va-common/web/va/types/muutoshakemus";
import React, {useMemo} from "react";
import {MuutosTaloudenKayttosuunnitelmaan} from "../../../../va-common/web/va/muutoshakemus/MuutosTaloudenKayttosuunnitelmaan";
import {MuutoshakemusSection} from "../../../../va-common/web/va/MuutoshakemusSection";
import {isError, isSubmitDisabled} from "../formikHelpers";
import {copyToClipboard} from "../copyToClipboard";
import {useTranslations} from "../../../../va-common/web/va/i18n/TranslationContext";
import {
  dateStringToMoment,
  getTalousarvio, getTalousarvioSchema,
  getTalousarvioValues, toFinnishDateFormat
} from "../../../../va-common/web/va/Muutoshakemus";
import {
  OsioKohtainenMuutoshakemusPaatosRequest,
  OsiokohtainenMuutoshakemusPaatosFormValues,
  PaatosStatus
} from "./hakemusTypes";
import {useFormik} from "formik";
import * as Yup from "yup";
import {
  fiLongFormat, parseDateString,
  parseDateStringToMoment
} from "../../../../va-common/web/va/i18n/dateformat";
import {paatosStatuses, PaatosStatusRadioButtonGroup} from "./PaatosStatus";
import {TalousarvioAcceptWithChangesForm} from "./TalousarvioAcceptWithChangesForm";
import Localization from "react-widgets/Localization";
import {translationsFi} from "../../../../va-common/web/va/i18n/translations";
import DatePicker from "react-widgets/DatePicker";
import moment from "moment";
import MomentLocalizer from 'react-widgets-moment'
import {getNestedInputErrorClass} from "../../../../va-common/web/va/formikHelpers";

moment.locale('fi')
const localizer = new MomentLocalizer(moment)

const formatDate = (date?: string): string => {
  const d = parseDateStringToMoment(date)
  return d && d.isValid() ? d.format(fiLongFormat) : ''
}

interface PaattymispaivaValuesProps {
  muutoshakemus: Muutoshakemus
  projectEndDate?: string
}

const PaattymispaivaValues = ({ muutoshakemus, projectEndDate }: PaattymispaivaValuesProps) => {
  const { t } = useTranslations()

  const isAcceptedWithChanges = muutoshakemus.status === 'accepted_with_changes'
  const currentEndDateTitle = isAcceptedWithChanges ? t.muutoshakemus.previousProjectEndDate : t.muutoshakemus.currentProjectEndDate
  const newEndDateTitle = isAcceptedWithChanges ? t.muutoshakemus.acceptedChange : t.muutoshakemus.appliedChange
  const newEndDateValue = isAcceptedWithChanges ? muutoshakemus['paatos-hyvaksytty-paattymispaiva'] : muutoshakemus['haettu-kayttoajan-paattymispaiva']
  const perustelut = muutoshakemus['kayttoajan-pidennys-perustelut']

  return (
    <React.Fragment>
      <div className="muutoshakemus-row muutoshakemus__project-end-row">
        <div>
          <h3 className="muutoshakemus__header" data-test-id='muutoshakemus-current-end-date-title'>{currentEndDateTitle}</h3>
          <div data-test-id="project-end-date">{projectEndDate}</div>
        </div>
        <div>
          <h3 className="muutoshakemus__header" data-test-id='muutoshakemus-new-end-date-title'>{newEndDateTitle}</h3>
          <div data-test-id="muutoshakemus-jatkoaika">{formatDate(newEndDateValue)}</div>
        </div>
      </div>
      <div className="muutoshakemus-row">
        <h4 className="muutoshakemus__header" data-test-id='muutoshakemus-reasoning-title'>{t.muutoshakemus.applicantReasoning}</h4>
        <div className="muutoshakemus__reason" data-test-id="muutoshakemus-jatkoaika-perustelu">{perustelut}</div>
      </div>
    </React.Fragment>
  )
}

const isAcceptedWithChanges = (status: PaatosStatus | undefined) => status === 'accepted_with_changes'

const errors = {
  required: 'Pakollinen kenttä',
  talousarvioSum: sum => `Loppusumman on oltava ${sum}`
}

const getPaatosSchema = (muutoshakemus: Muutoshakemus) => Yup.object().shape({
  reason: Yup.string()
    .required('Perustelu on pakollinen kenttä'),
  talousarvio: Yup.lazy<any>(talousarvio => talousarvio?.talousarvio ? Yup.object().shape({
    status: Yup.string(),
    talousarvio: Yup.object(getTalousarvioSchema(talousarvio.talousarvio, errors))
  }) : Yup.object()),
  'haen-kayttoajan-pidennysta': Yup.lazy<any>(paattymispaiva => {
    return muutoshakemus['haen-kayttoajan-pidennysta'] && paattymispaiva?.status === 'accepted_with_changes'
      ? Yup.object({
        status: Yup.string().required(),
        paattymispaiva: Yup.date().required('Päättymispäivä on pakollinen kenttä')
      }) : Yup.object({
        status: Yup.string().required()
      })
    }
  ),
  'hyvaksytyt-sisaltomuutokset': Yup.string().when('keys.status', {
    is: value => value !== 'rejected',
    then: muutoshakemus['haen-sisaltomuutosta'] ? Yup.string().required('Kuvaile hyväksytyt muutokset hankkeen sisältöön tai toteutustapaan on pakollinen kenttä!') : Yup.string(),
  })
})

interface OsiokohtainenMuutoshakemusFormProps {
  avustushaku: Avustushaku
  muutoshakemus: Muutoshakemus
  muutoshakemukset: Muutoshakemus[]
  hakemus: NormalizedHakemusData
  hakemusVersion: Hakemus
  controller: any
  userInfo: UserInfo
  presenter: Presenter
  projectEndDate: string | undefined
  isPresentingOfficer: boolean
  currentTalousarvio: Talousarvio
}

const getInitialValues = (talousarvioValues: TalousarvioValues | undefined, muutoshakemus: Muutoshakemus) => (): OsioKohtainenMuutoshakemusPaatosRequest => {
  const initialTalousarvio: OsioKohtainenMuutoshakemusPaatosRequest['talousarvio'] = talousarvioValues
    ? {
      status: 'accepted',
      talousarvio: talousarvioValues
    }
    : undefined
  const initialPidennys: OsioKohtainenMuutoshakemusPaatosRequest['haen-kayttoajan-pidennysta'] = muutoshakemus["haen-kayttoajan-pidennysta"]
    ? {
      status: 'accepted'
    }
    : undefined
  const initialSisaltomuutokset: OsioKohtainenMuutoshakemusPaatosRequest['hyvaksytyt-sisaltomuutokset'] = muutoshakemus['haen-sisaltomuutosta']
    ? {
      status: 'accepted'
    }
    : undefined
  return {
    talousarvio: initialTalousarvio,
    "haen-kayttoajan-pidennysta": initialPidennys,
    "hyvaksytyt-sisaltomuutokset": initialSisaltomuutokset,
    reason: ''
  }
}

export const OsiokohtainenMuutoshakemusForm = ({currentTalousarvio, muutoshakemus, muutoshakemukset, projectEndDate, hakemus}: OsiokohtainenMuutoshakemusFormProps) => {
  const { t } = useTranslations()
  const talousarvioValues = muutoshakemus.talousarvio.length ? getTalousarvioValues(muutoshakemus.talousarvio) : undefined
  const talousarvio = getTalousarvio(muutoshakemukset, hakemus.talousarvio)
  const initialValues = useMemo<OsioKohtainenMuutoshakemusPaatosRequest>(getInitialValues(talousarvioValues, muutoshakemus), [])
  const f = useFormik({
    initialValues,
    validationSchema: getPaatosSchema(muutoshakemus),
    onSubmit: async (values) => {
      console.log(values)
      //const payload = formToPayload(values)
      //const storedPaatos = await HttpUtil.post(`/api/avustushaku/${avustushaku.id}/hakemus/${hakemus['hakemus-id']}/muutoshakemus/${muutoshakemus.id}/paatos`, payload)
      //controller.setPaatos({ muutoshakemusId: muutoshakemus.id, hakemusId: hakemus['hakemus-id'], ...storedPaatos })
    }
  })
  const onPaatosPreviewClick = () => {}
  return (
    <form onSubmit={f.handleSubmit} data-test-id="muutoshakemus-form">
      {muutoshakemus['haettu-kayttoajan-paattymispaiva'] &&
      <MuutoshakemusSection
          blueMiddleComponent={<PaatosStatusRadioButtonGroup f={f} group="haen-kayttoajan-pidennysta" />}
          bottomComponent={isAcceptedWithChanges(f.values["haen-kayttoajan-pidennysta"]?.status)
            ? <KayttoajanPidennysAcceptWithChangesForm f={f} muutoshakemus={muutoshakemus} projectEndDate={projectEndDate} />
            : undefined
          }
          datepickerFix
      >
        <PaattymispaivaValues muutoshakemus={muutoshakemus}
                              projectEndDate={projectEndDate}/>
      </MuutoshakemusSection>
      }
      {!!talousarvio.length &&
      <MuutoshakemusSection
        blueMiddleComponent={<PaatosStatusRadioButtonGroup f={f} group="talousarvio"
                                                           talousarvioValues={talousarvioValues}/>}
        bottomComponent={
          isAcceptedWithChanges(f.values.talousarvio?.status)
            ? <TalousarvioAcceptWithChangesForm
              f={f}
              talousarvio={talousarvio}
              requestedTalousarvio={muutoshakemus.talousarvio}/>
            : undefined
        }>
        <MuutosTaloudenKayttosuunnitelmaan
          currentTalousarvio={currentTalousarvio}
          newTalousarvio={talousarvio}
          status={muutoshakemus.status}
          reason={muutoshakemus["talousarvio-perustelut"]}/>
      </MuutoshakemusSection>
      }
      {muutoshakemus['haen-sisaltomuutosta'] && (
        <MuutoshakemusSection
          blueMiddleComponent={<PaatosStatusRadioButtonGroup
            talousarvioValues={talousarvioValues}
            group="hyvaksytyt-sisaltomuutokset" f={f}/>}
          bottomComponent={isAcceptedWithChanges(f.values["hyvaksytyt-sisaltomuutokset"]?.status)
            ? <KayttoajanPidennysAcceptWithChangesForm f={f}
                                                       muutoshakemus={muutoshakemus}
                                                       projectEndDate={projectEndDate}/>
            : undefined
          }
        >
          <div className="muutoshakemus-row">
            <h4
              className="muutoshakemus__header">{t.sisaltomuutos.appliedChange}</h4>
            <div className="muutoshakemus__reason"
                 data-test-id="sisaltomuutos-perustelut">{muutoshakemus['sisaltomuutos-perustelut']}</div>
          </div>
          {muutoshakemus['hyvaksytyt-sisaltomuutokset'] && (
            <div className="muutoshakemus-row">
              <h4
                className="muutoshakemus__header">{t.sisaltomuutos.acceptedChanges}</h4>
              <div
                className="muutoshakemus__reason">{muutoshakemus['hyvaksytyt-sisaltomuutokset']}</div>
            </div>
          )}
        </MuutoshakemusSection>
      )}
      <MuutoshakemusSection
        blueMiddleComponent={<button type="submit" disabled={isSubmitDisabled(f)}
                                     data-test-id="muutoshakemus-submit">Tee päätös
          ja lähetä hakijalle</button>}>
        <div className="muutoshakemus-row">
          <h3 className="muutoshakemus__header">Yhteiset perustelut ja päätöksen
            lähettäminen</h3>
          <div>Jos päätös tarvitsee päällikön hyväksynnän, pyydä häntä katsomaan
            hakemus ja tekemään päätös.
          </div>
          <a onClick={() => copyToClipboard(window.location.href)}>Kopioi
            leikepöydälle linkki hakemukseen</a>
        </div>
        <div className="muutoshakemus-row">
          <h4 className="muutoshakemus__header">
            Perustelut <span className="muutoshakemus__default-reason-link"><a
            onClick={() => setDefaultReason(f, 'fi')}>Lisää vakioperustelu suomeksi</a> | <a
            onClick={() => setDefaultReason(f, 'sv')}>Lisää vakioperustelu ruotsiksi</a></span>
          </h4>
          <textarea id="reason" name="reason" rows={5} cols={53}
                    onChange={f.handleChange} onBlur={f.handleBlur}
                    value={f.values.reason}
                    className={isError(f, 'reason') ? "muutoshakemus__error" : undefined}/>
          {isError(f, 'reason') &&
          <div className="muutoshakemus__error">Perustelu on pakollinen
            kenttä!</div>}
        </div>
        <div className="muutoshakemus-row muutoshakemus__preview-row">
          <a className="muutoshakemus__paatos-preview-link"
             onClick={onPaatosPreviewClick}>Esikatsele päätösdokumentti</a>
        </div>
      </MuutoshakemusSection>
    </form>
  )
}

function setDefaultReason(f: OsiokohtainenMuutoshakemusPaatosFormValues, lang: 'fi' | 'sv') {
  const currentStatuses = [
    f.values.talousarvio?.status,
    f.values["hyvaksytyt-sisaltomuutokset"]?.status,
    f.values["haen-kayttoajan-pidennysta"]?.status
  ].filter(status => status !== undefined)
  if (currentStatuses.some(status => status === 'accepted_with_changes')) {
    return f.setFieldValue('reason', paatosStatuses[1].defaultReason[lang])
  }
  if (currentStatuses.every(status => status === 'accepted')) {
    return f.setFieldValue('reason', paatosStatuses[0].defaultReason[lang])
  }
  if (currentStatuses.every(status => status === 'rejected')) {
    return f.setFieldValue('reason', paatosStatuses[2].defaultReason[lang])
  }
  return f.setFieldValue('reason', '')
}

interface KayttoajanPidennysAcceptWithChangesFormProps {
  f: OsiokohtainenMuutoshakemusPaatosFormValues
  muutoshakemus: Muutoshakemus
  projectEndDate: string | undefined
}

const KayttoajanPidennysAcceptWithChangesForm = ({f, muutoshakemus, projectEndDate}: KayttoajanPidennysAcceptWithChangesFormProps): JSX.Element => {
  const haettuPaiva = dateStringToMoment(muutoshakemus['haettu-kayttoajan-paattymispaiva'])
  const errorInPaattymispaiva = f.touched['haen-kayttoajan-pidennysta'] && getNestedInputErrorClass(f, ['haen-kayttoajan-pidennysta', 'paattymispaiva'])
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
            onBlur={() => f.setFieldTouched('haen-kayttoajan-pidennysta')}
            onChange={(newDate) => {
              const d = moment(newDate)
              if (d.isValid()) {
                f.setFieldValue('haen-kayttoajan-pidennysta.paattymispaiva', d.toDate().toISOString())
              } else {
                f.setFieldValue('haen-kayttoajan-pidennysta.paattymispaiva', undefined)
              }
            }}
            parse={parseDateString}
            defaultValue={
              f.values['haen-kayttoajan-pidennysta']?.paattymispaiva
                ? moment(f.values['haen-kayttoajan-pidennysta']?.paattymispaiva).toDate()
                : haettuPaiva.toDate()
            }
            containerClassName={`datepicker ${errorInPaattymispaiva ? 'muutoshakemus__error' : ''}`} />
        </Localization>
      </div>
      {errorInPaattymispaiva && <span className="muutoshakemus__error row3 col3">Päättymispäivä on pakollinen kenttä!</span>}
    </div>
  )}
