import React, { Component } from 'react'
import DateUtil from 'soresu-form/web/DateUtil'
import FormEditor from './FormEditor'
import FormJsonEditor from './FormJsonEditor'
import { MuutoshakukelpoisuusContainer } from './MuutoshakukelpoisuusContainer'
import HakujenHallintaController, {Avustushaku} from "../HakujenHallintaController";
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { LegacyTranslations, Koodistos, Form, HelpTexts} from 'soresu-form/web/va/types'

interface FormEditorContainerProps {
  avustushaku: Avustushaku
  environment: EnvironmentApiResponse
  translations: LegacyTranslations
  koodistos: Koodistos
  formDraft: Form
  formDraftJson: string
  controller: HakujenHallintaController
  helpTexts: HelpTexts
}

export default class FormEditorContainer extends Component<FormEditorContainerProps> {
  render() {
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const koodistos = this.props.koodistos
    const formDraft = this.props.formDraft
    const formDraftJson = this.props.formDraftJson
    const controller = this.props.controller
    const updatedAt = avustushaku.formContent?.updated_at
    const helpTexts = this.props.helpTexts

    const environment = this.props.environment
    const hakuUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/?lang=fi"
    const hakuUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/?lang=sv"
    const previewUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/nayta?lang=fi"
    const previewUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/nayta?lang=sv"
    const formattedUpdatedDate = `${DateUtil.asDateString(updatedAt)} klo ${DateUtil.asTimeString(updatedAt)}`

    const onFormChange = (avustushaku: Avustushaku, newDraft: Form) =>{
      controller.formOnChangeListener(avustushaku, newDraft)
      controller.formOnJsonChangeListener(avustushaku, JSON.stringify(newDraft, null, 2))
    }

    const scrollToEditor = () =>
    {
        const textArea = document.querySelector<HTMLTextAreaElement>(".form-json-editor textarea")
        textArea?.scrollIntoView({block: "start", behavior: "smooth"})
        textArea?.focus()
    }

    const mainHelp = { __html: helpTexts["hakujen_hallinta__hakulomake___ohje"] }

    return (
      <section>
        {avustushaku.muutoshakukelpoisuus && <MuutoshakukelpoisuusContainer muutoshakukelpoisuus={avustushaku.muutoshakukelpoisuus}/>}
        <div dangerouslySetInnerHTML={mainHelp}/>
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
        <FormEditor avustushaku={avustushaku} translations={translations} formDraft={formDraft} koodistos={koodistos} controller={controller} onFormChange={onFormChange}/>
        <FormJsonEditor controller={controller} avustushaku={avustushaku} formDraftJson={formDraftJson} />
      </section>
    )
  }
}
