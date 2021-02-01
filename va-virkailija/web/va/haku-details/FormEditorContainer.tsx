import React from 'react'
import _ from 'lodash'

import DateUtil from 'soresu-form/web/DateUtil'

import { FormEditor } from './FormEditor'
import FormJsonEditor from './FormJsonEditor'
import { FormikHook } from 'va-common/web/va/standardized-form-fields/types'

interface FormEditorContainerProps { 
  avustushaku: any
  translations: any
  koodistos: any
  formDraft: any
  controller: any
  helpTexts: any
  environment: any
  f: FormikHook
}

export const FormEditorContainer = (props: FormEditorContainerProps) => {
  const avustushaku = props.avustushaku
  const translations = props.translations
  const koodistos = props.koodistos
  const formDraft = props.formDraft
  const controller = props.controller
  const updatedAt = _.get(avustushaku, "formContent.updated_at")
  const helpTexts = props.helpTexts
  const environment = props.environment
  const f = props.f

  const hakuUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/?lang=fi"
  const hakuUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/?lang=sv"
  const previewUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/nayta?lang=fi"
  const previewUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/nayta?lang=sv"
  const formattedUpdatedDate = `${DateUtil.asDateString(updatedAt)} klo ${DateUtil.asTimeString(updatedAt)}`

  const onFormChange = (avustushaku, newDraftJson) =>{
    controller.formOnChangeListener(avustushaku, newDraftJson)
  }

  const scrollToEditor = () =>
  {
      const textArea = document.querySelector(".form-json-editor textarea")
    if (textArea && textArea instanceof HTMLElement) {
      textArea.scrollIntoView({block: "start", behavior: "smooth"})
      textArea.focus()
    }
  }

  const mainHelp = { __html: helpTexts["hakujen_hallinta__hakulomake___ohje"] }

  return (
    <section>
      <div dangerouslySetInnerHTML={mainHelp}></div>
      <div style={{float:'right'}}><button className="btn btn-blue btn-sm" onClick={scrollToEditor}>JSON editoriin</button></div>
      {updatedAt && <div style={{float:'right',marginRight:20}}>Päivitetty: {formattedUpdatedDate}</div>}
      <div className="link-list">
        <div className="link-list-item">
          <h3>Linkki hakuun</h3>
          <a target="haku-preview-fi" href={hakuUrlFi}>Suomeksi</a><span className="link-divider"/><a target="haku-preview-sv" href={hakuUrlSv}>Ruotsiksi</a>
        </div>
        <div className="link-list-item">
          <h3>Hakulomakkeen esikatselu</h3>
          <a target="haku-preview-fi" href={previewUrlFi}>Suomeksi</a><span className="link-divider"/><a target="haku-preview-sv" href={previewUrlSv}>Ruotsiksi</a>
        </div>
      </div>
      <FormEditor avustushaku={avustushaku} translations={translations} formDraft={formDraft} koodistos={koodistos} controller={controller} onFormChange={onFormChange} f={f} environment={environment} disableStandardizedFields={false}/>
      { formDraft ? <FormJsonEditor controller={controller} avustushaku={avustushaku} formDraft={formDraft} f={f} /> : null }
    </section>
  )
}
