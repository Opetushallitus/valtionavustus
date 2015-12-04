import React, { Component } from 'react'

import FormEditor from './FormEditor.jsx'
import FormJsonEditor from './FormJsonEditor.jsx'

export default class FormEditorContainer extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const koodistos = this.props.koodistos
    const formDraft = this.props.formDraft
    const controller = this.props.controller

    const environment = this.props.environment
    const hakuUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/?lang=fi"
    const hakuUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/?lang=sv"
    const previewUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/nayta?lang=fi"
    const previewUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/nayta?lang=sv"
    return (
      <section>
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
        <FormEditor avustushaku={avustushaku} translations={translations} formDraft={formDraft} koodistos={koodistos} controller={controller} />
        <FormJsonEditor controller={controller} avustushaku={avustushaku} formDraft={formDraft} />
      </section>
    )
  }
}
