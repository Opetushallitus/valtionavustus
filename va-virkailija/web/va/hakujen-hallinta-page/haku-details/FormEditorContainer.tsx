import React from 'react'
import DateUtil from 'soresu-form/web/DateUtil'
import FormEditor from './FormEditor'
import FormJsonEditor from './FormJsonEditor'
import { ValidationContainer, ScrollAwareValidationContainer } from './ValidationContainer'
import { Field, Form } from 'soresu-form/web/va/types'
import { useHakujenHallintaDispatch, useHakujenHallintaSelector } from '../hakujenHallintaStore'
import {
  VirkailijaAvustushaku,
  formJsonUpdated,
  formUpdated,
  selectHakuState,
  selectLoadedInitialData,
} from '../hakuReducer'
import { tryToUseCurrentAvustushaku, useCurrentAvustushaku } from '../useAvustushaku'
import FormUtil from 'soresu-form/web/form/FormUtil'
import { ValidationResult } from '../../types'
import ChooseAvustushaku from './ChooseAvustushaku'

const trustedContact = {
  name: {
    fieldId: 'trusted-contact-name',
    label: 'Varayhteyshenkilön nimi',
  },
  email: {
    fieldId: 'trusted-contact-email',
    label: 'Varayhteyshenkilön sähköpostiosoite',
  },
  phone: {
    fieldId: 'trusted-contact-phone',
    label: 'Varayhteyshenkilön puhelinnumero',
  },
}
const hasVarayhteyshenkiloFields = (formContent: Field[] = []): ValidationResult => {
  const results = [trustedContact.name, trustedContact.email, trustedContact.phone].reduce<
    Omit<ValidationResult, 'is-ok'>
  >(
    (acc, { fieldId, label }) => {
      const foundField = FormUtil.findField(formContent, fieldId)
      if (foundField) {
        acc['ok-fields'].push({ id: fieldId, label })
      } else {
        acc['erroneous-fields'].push({ id: fieldId, label })
      }
      return acc
    },
    { 'ok-fields': [], 'erroneous-fields': [] }
  )
  return {
    ...results,
    'is-ok': results['erroneous-fields'].length === 0,
  }
}

const FormEditorPage = () => {
  const dispatch = useHakujenHallintaDispatch()
  const avustushaku = useCurrentAvustushaku()
  const { environment, helpTexts } = useHakujenHallintaSelector(selectLoadedInitialData)
  const formDraft = useHakujenHallintaSelector((state) => state.haku.formDrafts[avustushaku.id])
  const formDraftJson = useHakujenHallintaSelector(
    (state) => state.haku.formDraftsJson[avustushaku.id]
  )
  const { koodistos } = useHakujenHallintaSelector(selectHakuState)

  const updatedAt = avustushaku.formContent?.updated_at
  const hakuUrlFi =
    environment['hakija-server'].url.fi + 'avustushaku/' + avustushaku.id + '/?lang=fi'
  const hakuUrlSv =
    environment['hakija-server'].url.sv + 'avustushaku/' + avustushaku.id + '/?lang=sv'
  const previewUrlFi =
    environment['hakija-server'].url.fi + 'avustushaku/' + avustushaku.id + '/esikatselu?lang=fi'
  const previewUrlSv =
    environment['hakija-server'].url.sv + 'avustushaku/' + avustushaku.id + '/esikatselu?lang=sv'
  const formattedUpdatedDate = `${DateUtil.asDateString(updatedAt)} klo ${DateUtil.asTimeString(
    updatedAt
  )}`
  const varayhteyshenkiloResult = hasVarayhteyshenkiloFields(formDraft?.content)
  const onFormChange = ({ id: avustushakuId }: VirkailijaAvustushaku, newDraft: Form) => {
    dispatch(formUpdated({ avustushakuId, newForm: newDraft }))
    dispatch(
      formJsonUpdated({
        avustushakuId,
        newFormJson: JSON.stringify(newDraft, null, 2),
      })
    )
  }

  const scrollToEditor = () => {
    const textArea = document.querySelector<HTMLTextAreaElement>('.form-json-editor textarea')
    textArea?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    textArea?.focus()
  }

  const mainHelp = {
    __html: helpTexts['hakujen_hallinta__hakulomake___ohje'],
  }

  return (
    <section>
      {!varayhteyshenkiloResult['is-ok'] && (
        <ValidationContainer
          result={varayhteyshenkiloResult}
          avustushakuMuutoshakukelpoinen={avustushaku.muutoshakukelpoinen}
          errorTexts={{
            single: 'Hakemukselta puuttuu varayhteyshenkilön täyttöön liittyvä kenttä.',
            multiple: (numberOfErrors) =>
              `Hakemukselta puuttuu ${numberOfErrors} varayhteyshenkilön täyttöön tarvittavaa kenttää.`,
          }}
        />
      )}
      {avustushaku.muutoshakukelpoisuus && (
        <ScrollAwareValidationContainer
          result={avustushaku.muutoshakukelpoisuus}
          avustushakuMuutoshakukelpoinen={avustushaku.muutoshakukelpoinen}
        />
      )}
      <div dangerouslySetInnerHTML={mainHelp} />
      <div style={{ float: 'right' }}>
        <button className="btn btn-blue btn-sm" onClick={scrollToEditor}>
          JSON editoriin
        </button>
      </div>
      {updatedAt && (
        <div style={{ float: 'right', marginRight: 20 }}>Päivitetty: {formattedUpdatedDate}</div>
      )}
      <div className="link-list">
        <div className="link-list-item">
          <h3>Linkki hakuun</h3>
          <a target="haku-preview-fi" href={hakuUrlFi}>
            Suomeksi
          </a>
          <span className="link-divider" />
          <a target="haku-preview-sv" href={hakuUrlSv}>
            Ruotsiksi
          </a>
        </div>
        <div className="link-list-item">
          <h3>Hakulomakkeen esikatselu</h3>
          <a target="haku-preview-fi" href={previewUrlFi}>
            Suomeksi
          </a>
          <span className="link-divider" />
          <a target="haku-preview-sv" href={previewUrlSv}>
            Ruotsiksi
          </a>
        </div>
      </div>
      <FormEditor
        avustushaku={avustushaku}
        formDraft={formDraft}
        koodistos={koodistos}
        onFormChange={onFormChange}
      />
      <FormJsonEditor avustushaku={avustushaku} formDraftJson={formDraftJson} />
    </section>
  )
}

const FormEditorContainer = () => {
  const avustushaku = tryToUseCurrentAvustushaku()
  if (!avustushaku) {
    return <ChooseAvustushaku />
  }
  return <FormEditorPage />
}

export default FormEditorContainer
