import {
  Avustushaku, Hakemus,
  NormalizedHakemusData, UserInfo
} from "va-common/web/va/types";
import {
  Meno,
  Muutoshakemus,
  Talousarvio, TalousarvioValues,
} from "va-common/web/va/types/muutoshakemus";
import React, {useMemo} from "react";
import {MuutosTaloudenKayttosuunnitelmaan} from "va-common/web/va/muutoshakemus/MuutosTaloudenKayttosuunnitelmaan";
import {MuutoshakemusSection} from "va-common/web/va/MuutoshakemusSection";
import {isError, isSubmitDisabled} from "../formikHelpers";
import {copyToClipboard} from "../copyToClipboard";
import {
  getTranslationContext,
  TranslationContext,
  useTranslations
} from "va-common/web/va/i18n/TranslationContext";
import {
  dateStringToMoment,
  getTalousarvio,
  getTalousarvioSchema,
  getTalousarvioValues,
  isAccepted,
  isAcceptedWithChanges, isAcceptedWithOrWithoutChanges,
  isRejected,
  toFinnishDateFormat
} from "va-common/web/va/Muutoshakemus";
import {
  MuutoshakemusPaatosRequest,
  MuutoshakemusPaatosFormValues,
  MuutoshakemusPaatosResponse
} from "./hakemusTypes";
import {useFormik} from "formik";
import * as Yup from "yup";
import {
  fiLongFormat, isoFormat, parseDateString,
  parseDateStringToMoment
} from "va-common/web/va/i18n/dateformat";
import {paatosStatuses, PaatosStatusRadioButtonGroup} from "./PaatosStatus";
import {TalousarvioAcceptWithChangesForm} from "./TalousarvioAcceptWithChangesForm";
import Localization from "react-widgets/Localization";
import {translationsFi} from "va-common/web/va/i18n/translations";
import DatePicker from "react-widgets/DatePicker";
import moment from "moment";
import MomentLocalizer from 'react-widgets-moment'
import {
  getNestedInputErrorClass
} from "va-common/web/va/formikHelpers";
import {Role} from "../types";
import HttpUtil from "soresu-form/web/HttpUtil";
import {omit} from "lodash";
import HakemustenArviointiController from "../HakemustenArviointiController";

import 'soresu-form/web/form/style/main.less'
import '../style/main.less'
import {Modal} from "./Modal";
import {MuutoshakemusPaatos} from "va-common/web/va/MuutoshakemusPaatos";
import {EnvironmentApiResponse} from "va-common/web/va/types/environment";

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

  const acceptedWithChanges = isAcceptedWithChanges(muutoshakemus["paatos-status-jatkoaika"])
  const currentEndDateTitle = acceptedWithChanges ? t.muutoshakemus.previousProjectEndDate : t.muutoshakemus.currentProjectEndDate
  const newEndDateTitle = acceptedWithChanges ? t.muutoshakemus.acceptedChange : t.muutoshakemus.appliedChange
  const newEndDateValue = acceptedWithChanges ? muutoshakemus['paatos-hyvaksytty-paattymispaiva'] : muutoshakemus['haettu-kayttoajan-paattymispaiva']
  const perustelut = muutoshakemus['kayttoajan-pidennys-perustelut']

  return (
    <React.Fragment>
      <div className="muutoshakemus__project-end-row">
        <div>
          <h3 className="muutoshakemus__header" data-test-id='muutoshakemus-current-end-date-title'>{currentEndDateTitle}</h3>
          <div data-test-id="project-end-date" className="muutoshakemus-description-box">{projectEndDate}</div>
        </div>
        <div>
          <h3 className="muutoshakemus__header" data-test-id='muutoshakemus-new-end-date-title'>{newEndDateTitle}</h3>
          <div data-test-id="muutoshakemus-jatkoaika" className="muutoshakemus-description-box">{formatDate(newEndDateValue)}</div>
        </div>
      </div>
      <div className="muutoshakemus-row">
        <h4 className="muutoshakemus__header" data-test-id='muutoshakemus-reasoning-title'>{t.muutoshakemus.applicantReasoning}</h4>
        <div className="muutoshakemus-description-box" data-test-id="muutoshakemus-jatkoaika-perustelu">{perustelut}</div>
      </div>
    </React.Fragment>
  )
}

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
      }) : Yup.object()
    }
  ),
  'haen-sisaltomuutosta': Yup.lazy<any>(haenSisaltomuutosta => {
    const sisaltomuutosStatus = haenSisaltomuutosta?.status
    return isAcceptedWithOrWithoutChanges(sisaltomuutosStatus)
      ? Yup.object({
        status: Yup.string().required(),
      })
      : Yup.string()
  })
})

interface MuutoshakemusFormProps {
  avustushaku: Avustushaku
  muutoshakemus: Muutoshakemus
  muutoshakemukset: Muutoshakemus[]
  hakemus: NormalizedHakemusData
  hakemusVersion: Hakemus
  controller: HakemustenArviointiController
  userInfo: UserInfo
  presenter: Role | undefined
  projectEndDate: string | undefined
  isPresentingOfficer: boolean
  currentTalousarvio: Talousarvio
  environment: EnvironmentApiResponse
}

const getInitialValues = (talousarvioValues: TalousarvioValues | undefined, muutoshakemus: Muutoshakemus) => (): MuutoshakemusPaatosRequest => {
  const initialTalousarvio: MuutoshakemusPaatosRequest['talousarvio'] = talousarvioValues
    ? {
      status: 'accepted',
      talousarvio: talousarvioValues
    }
    : undefined
  const initialPidennys: MuutoshakemusPaatosRequest['haen-kayttoajan-pidennysta'] = muutoshakemus["haen-kayttoajan-pidennysta"]
    ? {
      status: 'accepted'
    }
    : undefined
  const initialSisaltomuutokset: MuutoshakemusPaatosRequest['haen-sisaltomuutosta'] = muutoshakemus['haen-sisaltomuutosta']
    ? {
      status: 'accepted'
    }
    : undefined
  return {
    talousarvio: initialTalousarvio,
    "haen-kayttoajan-pidennysta": initialPidennys,
    "haen-sisaltomuutosta": initialSisaltomuutokset,
    reason: ''
  }
}

const formToPayload = (values: MuutoshakemusPaatosRequest) => {
  return {
    reason: values.reason,
    'haen-sisaltomuutosta': values['haen-sisaltomuutosta'] && {
      status: values["haen-sisaltomuutosta"]?.status
    },
    talousarvio: values.talousarvio && {
      talousarvio: omit(values.talousarvio.talousarvio, ['currentSum', 'originalSum']),
      status: values.talousarvio.status
    },
    'haen-kayttoajan-pidennysta': values["haen-kayttoajan-pidennysta"]?.status && {
      paattymispaiva: values["haen-kayttoajan-pidennysta"].paattymispaiva
        ? moment(values["haen-kayttoajan-pidennysta"].paattymispaiva).format(isoFormat)
        : undefined,
      status: values["haen-kayttoajan-pidennysta"].status
    }
  }
}



export const MuutoshakemusForm = ({avustushaku, currentTalousarvio, muutoshakemus, muutoshakemukset, projectEndDate, hakemus, controller, presenter, isPresentingOfficer, hakemusVersion, userInfo, environment}: MuutoshakemusFormProps) => {
  const { t } = useTranslations()
  const talousarvioValues = muutoshakemus.talousarvio.length ? getTalousarvioValues(muutoshakemus.talousarvio) : undefined
  const talousarvio = getTalousarvio(muutoshakemukset, hakemus.talousarvio)
  const initialValues = useMemo(getInitialValues(talousarvioValues, muutoshakemus), [])
  const f = useFormik<MuutoshakemusPaatosRequest>({
    initialValues,
    validationSchema: getPaatosSchema(muutoshakemus),
    onSubmit: async (values) => {
      const payload = formToPayload(values)
      const url = `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus['hakemus-id']}/muutoshakemus/${muutoshakemus.id}/paatos`
      const storedPaatos: MuutoshakemusPaatosResponse = await HttpUtil.post(url, payload)
      controller.setPaatos({ muutoshakemusId: muutoshakemus.id, hakemusId: hakemus['hakemus-id'], ...storedPaatos })
    }
  })

  const onPaatosPreviewClick = () => {
    const paatos = {
      'paatos-status-jatkoaika': f.values["haen-kayttoajan-pidennysta"]?.status,
      paattymispaiva: f.values["haen-kayttoajan-pidennysta"]?.paattymispaiva,
      'paatos-status-sisaltomuutos': f.values["haen-sisaltomuutosta"]?.status,
      'paatos-status-talousarvio': f.values.talousarvio?.status,
      reason: f.values.reason,
      'created-at': new Date().toISOString(),
      decider: `${userInfo['first-name']} ${userInfo['surname']}`,
      talousarvio: muutoshakemus.talousarvio.reduce<Meno[]>((acc, meno) => {
        const formTalousArvio = f.values.talousarvio?.talousarvio
        if (!formTalousArvio) {
          return acc
        }
        const amount = formTalousArvio[meno.type]
        if (amount) {
          acc.push({ ...meno, amount })
        }
        return acc
      }, []),
      status: undefined
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
            muutoshakemukset={muutoshakemukset}
            environment={environment}
            muutoshakemusUrl={hakemusVersion.muutoshakemusUrl}
          />
        </TranslationContext.Provider>
      </Modal>
    )
  }

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
        <h2 className="muutoshakemus-section-title">Käyttöaika</h2>
        <PaattymispaivaValues muutoshakemus={muutoshakemus}
                              projectEndDate={projectEndDate}/>
      </MuutoshakemusSection>
      }
      {!!muutoshakemus.talousarvio.length &&
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
        <h2 className="muutoshakemus-section-title">Budjetti</h2>
        <MuutosTaloudenKayttosuunnitelmaan
          currentTalousarvio={currentTalousarvio}
          newTalousarvio={muutoshakemus.talousarvio}
          status={muutoshakemus["paatos-status-talousarvio"]}
          reason={muutoshakemus["talousarvio-perustelut"]}/>
      </MuutoshakemusSection>
      }
      {muutoshakemus['haen-sisaltomuutosta'] && (
        <MuutoshakemusSection blueMiddleComponent={<PaatosStatusRadioButtonGroup group="haen-sisaltomuutosta" f={f}/>}>
          <h2 className="muutoshakemus-section-title">Sisältö ja toteutustapa</h2>
          <div className="muutoshakemus-row">
            <h4
              className="muutoshakemus__header">{t.sisaltomuutos.appliedChange}</h4>
            <div className="muutoshakemus-description-box"
                 data-test-id="sisaltomuutos-perustelut">{muutoshakemus['sisaltomuutos-perustelut']}</div>
          </div>
          {isAcceptedWithChanges(f.values["haen-sisaltomuutosta"]?.status) && (
            <div className="muutoshakemus-notice">
              Olet tekemässä päätöksen, jossa haetut sisältömuutokset hyväksytään muutettuna. Varmista, että perusteluissa hakijalle kuvataan mitkä haetuista sisältömuutoksista hyväksytään ja mitkä hylätään.
            </div>
          )}
        </MuutoshakemusSection>
      )}
      <MuutoshakemusSection
        blueMiddleComponent={<button type="submit" disabled={isSubmitDisabled(f)}
                                     data-test-id="muutoshakemus-submit">Tee päätös
          ja lähetä hakijalle</button>}>
        <div>
          <h2 className="muutoshakemus-section-title">Yhteiset perustelut ja päätöksen lähettäminen</h2>
          <div className="muutoshakemus-paatos-notice">Jos päätös tarvitsee päällikön hyväksynnän, pyydä häntä katsomaan
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

function setDefaultReason(f: MuutoshakemusPaatosFormValues, lang: 'fi' | 'sv') {
  const currentStatuses = [
    f.values.talousarvio?.status,
    f.values["haen-kayttoajan-pidennysta"]?.status,
    f.values["haen-sisaltomuutosta"]?.status
  ].filter(status => status !== undefined)
  if (currentStatuses.some(isAcceptedWithChanges)) {
    return f.setFieldValue('reason', paatosStatuses[1].defaultReason[lang])
  }
  if (currentStatuses.every(isAccepted)) {
    return f.setFieldValue('reason', paatosStatuses[0].defaultReason[lang])
  }
  if (currentStatuses.every(isRejected)) {
    return f.setFieldValue('reason', paatosStatuses[2].defaultReason[lang])
  }
  return f.setFieldValue('reason', '')
}

interface KayttoajanPidennysAcceptWithChangesFormProps {
  f: MuutoshakemusPaatosFormValues
  muutoshakemus: Muutoshakemus
  projectEndDate: string | undefined
}

const KayttoajanPidennysAcceptWithChangesForm = ({f, muutoshakemus, projectEndDate}: KayttoajanPidennysAcceptWithChangesFormProps): JSX.Element => {
  const haettuPaiva = dateStringToMoment(muutoshakemus['haettu-kayttoajan-paattymispaiva'])
  const errorInPaattymispaiva = f.touched['haen-kayttoajan-pidennysta'] && getNestedInputErrorClass(f, ['haen-kayttoajan-pidennysta', 'paattymispaiva'])
  return (
    <div className="muutoshakemus-row muutoshakemus__project-end-row muutoshakemus__accept-with-changes">

      <h3 className="muutoshakemus__header row1 col1">Voimassaoleva päättymisaika</h3>
      <div data-test-id="current-project-end-date" className="row2 col1 muutoshakemus-description-box">{projectEndDate}</div>


      <h3 className="muutoshakemus__header row1 col2">Haettu muutos</h3>
      <div data-test-id="approve-with-changes-muutoshakemus-jatkoaika" className="row2 col2 muutoshakemus-description-box">
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
