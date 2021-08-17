import React, { Component } from 'react'
import _ from 'lodash'

import DateUtil from 'soresu-form/web/DateUtil'

import FormEditor from './FormEditor.jsx'
import FormJsonEditor from './FormJsonEditor.jsx'
import { MuutoshakukelpoisuusContainer } from './MuutoshakukelpoisuusContainer'

export default class FormEditorContainer extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const koodistos = this.props.koodistos
    const formDraft = this.props.formDraft
    const controller = this.props.controller
    const updatedAt = _.get(avustushaku, "formContent.updated_at")
    const helpTexts = this.props.helpTexts

    const environment = this.props.environment
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
        textArea.scrollIntoView({block: "start", behavior: "smooth"})
        textArea.focus()
    }

    const mainHelp = { __html: helpTexts["hakujen_hallinta__hakulomake___ohje"] }

    return (
      <section>
        {(avustushaku.muutoshakukelpoinen && avustushaku.muutoshakukelpoisuus && !avustushaku.muutoshakukelpoisuus["is-ok"]) && <MuutoshakukelpoisuusContainer muutoshakukelpoisuus={avustushaku.muutoshakukelpoisuus}/>}
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
        <FormEditor avustushaku={avustushaku} translations={translations} formDraft={formDraft} koodistos={koodistos} controller={controller} onFormChange={onFormChange}/>
        { formDraft ? <FormJsonEditor controller={controller} avustushaku={avustushaku} formDraft={formDraft} /> : null }
      </section>
    )
  }
}
