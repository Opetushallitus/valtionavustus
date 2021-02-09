import React from 'react'
import _ from 'lodash'

import HttpUtil from "soresu-form/web/HttpUtil"
import DateUtil from 'soresu-form/web/DateUtil'

import FormEditor from './FormEditor.jsx'

export default class SelvitysFormEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = SelvitysFormEditor.initialState(props)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.avustushaku.id !== state.currentAvustushakuId) {
      return SelvitysFormEditor.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    return {
      currentAvustushakuId: props.avustushaku.id,
      count: undefined,
      sending: false
    }
  }

  render(){
    const {avustushaku, controller, translations, koodistos, selvitysType,environment, helpTexts} = this.props
    const formDraft = this.props[selvitysType + "FormDraft"]
    const formContent = avustushaku[selvitysType + "Form"]
    const updatedAtElementId = `${selvitysType}UpdatedAt`
    const updatedAt = formContent.updated_at
    const formattedUpdatedDate = `${DateUtil.asDateString(updatedAt)} klo ${DateUtil.asTimeString(updatedAt)}`

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
    const scrollToTop = () => {
      window.scrollTo(0, 0)
    }

    let parsedForm = formDraft
    let parseError = false
    try {
      parsedForm = JSON.parse(formDraft)
    } catch (error) {
      parseError = error.toString()
    }

    function formHasBeenEdited() {
      return formDraft && formContent && !_.isEqual(parsedForm, formContent)
    }

    const disableSave = parseError !== false || !formHasBeenEdited()

    const recreateForm = () => {
      controller.selvitysFormOnRecreate(avustushaku, selvitysType)
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
      <p>Väliselvitys tulee toimittaa viimeistään <strong>{this.props.avustushaku[selvitysType + 'date']}</strong>.</p>
      <p>Väliselvityspyynnöt lähetetään niille hakijoille, joiden hakemukset on hyväksytty ja jotka eivät ole vielä toimittaneet väliselvitystä.</p>
      <div data-test-id='valiselvitys-ohje' dangerouslySetInnerHTML={{__html: helpTexts["hakujen_hallinta__väliselvitys___ohje"]}} />
      <p>
        <button disabled={sending} onClick={onSendSelvitys}>Lähetä väliselvityspyynnöt</button>
        {!isNaN(count) && <span> Lähetetty {count} viestiä</span>}
      </p>
      <h1>Väliselvityslomake</h1>
    </div>

    const loppuSelvitysSection = <div>
      <h4>Loppuselvityksen lähettäminen</h4>
      <p>Loppuselvitys on koko ajan täytettävissä ja se tulee toimittaa viimeistään <strong>{this.props.avustushaku[selvitysType + 'date']}</strong>.</p>
      <p>Loppuselvityspyynnöt lähetetään niille hakijoille, joiden hakemukset on hyväksytty ja jotka eivät ole vielä toimittaneet loppuselvitystä.</p>
      <div data-test-id='loppuselvitys-ohje' dangerouslySetInnerHTML={{__html: helpTexts["hakujen_hallinta__loppuselvitys___ohje"]}} />
      <p>
        <button disabled={sending} onClick={onSendSelvitys}>Lähetä loppuselvityspyynnöt</button>
        {!isNaN(count) && <span> Lähetetty {count} viestiä</span>}
      </p>
      <h1>Loppuselvityslomake</h1>
    </div>

    return (
      <div>
        {selvitysType === 'valiselvitys' ? valiselvitysSection : loppuSelvitysSection}
        <button style={{float:'right'}} onClick={recreateForm}>Palauta alkuperäiset kysymykset</button>
        {updatedAt && <div id={updatedAtElementId} style={{float:'right',marginRight:20}}>Päivitetty: {formattedUpdatedDate}</div>}
        <div className="link-list">
          <div className="link-list-item">
            <h3>Lomakkeen esikatselu</h3>
            <a target="_blank"
               rel="noopener noreferrer"
               href={previewUrlFi}>
              Suomeksi
            </a>
            <span className="link-divider"/>
            <a target="_blank"
               rel="noopener noreferrer"
               href={previewUrlSv}>
              Ruotsiksi
            </a>
          </div>
        </div>
        <FormEditor avustushaku={avustushaku} translations={translations} formDraft={formDraft} koodistos={koodistos} controller={controller} onFormChange={onFormChange} />
        <div className="form-json-editor">
          <h3>Hakulomakkeen sisältö</h3>
          <span className="error">{parseError}</span>
          <div className="btn-fixed-container">
            <button className="btn-fixed" type="button" onClick={scrollToTop}>Takaisin ylös</button>
            <button className="btn-fixed" type="button" onClick={onSaveForm} disabled={disableSave}>Tallenna</button>
          </div>
          <textarea onChange={onJsonChange} value={formDraft}/>
        </div>
      </div>
    )
  }
}
