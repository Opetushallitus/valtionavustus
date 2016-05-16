import React, { Component } from 'react'
import FormEditor from './FormEditor.jsx'
import FormJsonEditor from './FormJsonEditor.jsx'

export default class SelvitysFormEditor extends React.Component{
  render(){
    const {avustushaku, controller, translations, koodistos, selvitysType,environment} = this.props
    const formDraft = this.props[selvitysType + "FormDraft"]
    const formContent = avustushaku[selvitysType + "Form"]

    const previewUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/" + selvitysType
    const previewUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/" + selvitysType + "?lang=sv"

    const onFormChange = (avustushaku, newDraftJson) =>{
      controller.selvitysFormOnChangeListener(avustushaku, newDraftJson, selvitysType)
    }

    const onJsonChange = e => {
      controller.selvitysFormOnChangeListener(avustushaku, e.target.value, selvitysType)
    }

    const onSaveForm = () => {
      controller.saveSelvitysForm(avustushaku, formDraft, selvitysType)
    }

    var parsedForm = formDraft
    var parseError = false
    try {
      parsedForm = JSON.parse(formDraft)
    }
    catch (error) {
      parseError = error.toString()
    }

    function formHasBeenEdited() {
      return (formDraft && formContent) && !_.isEqual(parsedForm, formContent)
    }

    const disableSave = !formHasBeenEdited()

    return (
      <div >
        <div className="link-list">
          <div className="link-list-item">
            <h3>Lomakkeen esikatselu</h3>
            <a target="haku-preview-fi" href={previewUrlFi}>Suomeksi</a><span className="link-divider"/><a target="haku-preview-sv" href={previewUrlSv}>Ruotsiksi</a>
          </div>
        </div>

        <FormEditor avustushaku={avustushaku} translations={translations} formDraft={formDraft} koodistos={koodistos} controller={controller} onFormChange={onFormChange} />
        <div className="form-json-editor">
          <h3>Hakulomakkeen sisältö</h3>
          <textarea onChange={onJsonChange} value={formDraft}/>
          <button className="btn-fixed" type="button" onClick={onSaveForm}  disabled={disableSave}>Tallenna</button>
        </div>
      </div>
    )
  }
}