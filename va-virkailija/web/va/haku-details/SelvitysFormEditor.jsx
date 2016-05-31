import React, { Component } from 'react'
import FormEditor from './FormEditor.jsx'
import FormJsonEditor from './FormJsonEditor.jsx'
import LoppuselvitysForm from '../data/LoppuselvitysForm.json'
import ValiselvitysForm from '../data/ValiselvitysForm.json'
import HttpUtil from "../../../../va-common/web/HttpUtil";

export default class SelvitysFormEditor extends React.Component{

  componentWillReceiveProps(nextProps) {
    if (this.props.avustushaku.id !== nextProps.avustushaku.id) {
      this.setState({count:undefined, sending:false})
    }
  }

  render(){
    const {avustushaku, controller, translations, koodistos, selvitysType,environment} = this.props
    const formDraft = this.props[selvitysType + "FormDraft"]
    const formContent = avustushaku[selvitysType + "Form"]

    const previewUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/" + selvitysType
    const previewUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/" + selvitysType + "?lang=sv"
    const count = _.get(this.state, 'count')
    const sending = _.get(this.state, 'sending')
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

    const recreateForm = () => {
      const form = selvitysType=="valiselvitys" ? ValiselvitysForm : LoppuselvitysForm
      controller.selvitysFormOnChangeListener(avustushaku, JSON.stringify(form), selvitysType)
    }

    const onSendSelvitys = () => {
      this.setState({sending: true})
      HttpUtil.post(`/api/avustushaku/${avustushaku.id}/selvitys/${selvitysType}/send-notification`)
        .then(response => {
          this.setState({count: response.count, sending: false})
        })

    }
    
    const valiselvitysSection = <div>
      <h4>Väliselvitysten lähettäminen</h4>
      <p>Väliselvitys tulee toimittaa viimeistään <strong>{this.props.avustushaku[selvitysType + 'date']}</strong> ja se avautuu täytettäväksi 2 kuukautta aikaisemmin.</p>
      <p>Väliselvityspyynnöt lähetetään vain niille hakijoille, jotka eivät ole vielä toimittaneet selvitystä.</p>
      <p>
        <button disabled={sending} onClick={onSendSelvitys}>Lähetä väliselvityspyynnöt</button>
        {!isNaN(count) && <span> Lähetetty {count} viestiä</span>}
      </p>
      <h1>Väliselvityslomake</h1>
    </div>

    const loppuSelvitysSection = <div>
      <h4>Loppuselvityksen lähettäminen</h4>
      <p>Loppuselvitys on koko ajan täytettävissä ja se tulee toimittaa viimeistään <strong>{this.props.avustushaku[selvitysType + 'date']}.</strong></p>
      <p>Loppuselvityspyynnöt lähetetään vain niille hakijoille, jotka eivät ole vielä toimittaneet selvitystä.</p>
      <p>
        <button onClick={onSendSelvitys}>Lähetä loppuselvityspyynnöt</button>
      </p>
      <h1>Loppuselvityslomake</h1>
    </div>

    return (
      <div>
        {selvitysType === 'valiselvitys' ? valiselvitysSection : loppuSelvitysSection}
        <button style={{float:'right'}} onClick={recreateForm}>Palauta alkuperäiset kysymykset</button>
        <div className="link-list">
          <div className="link-list-item">
            <h3>Lomakkeen esikatselu</h3>
            <a target="_blank" href={previewUrlFi}>Suomeksi</a><span className="link-divider"/>
            <a target="_blank" href={previewUrlSv}>Ruotsiksi</a>
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