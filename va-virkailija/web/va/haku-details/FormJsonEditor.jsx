import { Component } from 'react';
import _ from 'lodash'

function scrollToTop() {
  window.scrollTo(0, 0)
}
export default class FormJsonEditor extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const formDraftJson = this.props.formDraftJson
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const hakuIsDraft = avustushaku.status === "draft"

    const onChange = e => {
      controller.formOnJsonChangeListener(avustushaku, e.target.value)
      try {
        const parsedDraft = JSON.parse(e.target.value)
        controller.formOnChangeListener(avustushaku, parsedDraft)
      } catch (e)
      {
      }
    }
    const onClick = () => {
      controller.saveForm(avustushaku, formDraftJson)
    }

    let parsedForm = formDraftJson
    let parseError = false
    try {
      parsedForm = JSON.parse(formDraftJson)
    } catch (error) {
      parseError = error.toString()
    }
    const saveDisabledError = (() => {
      if (!userHasEditPrivilege) {
        return 'Sinulla ei ole muokkausoikeutta tähän lomakkeeseen'
      }
      if (parseError) {
        return 'Virhe Hakulomakkeen sisältö -kentässä'
      }
      if (!hakuIsDraft) {
        return 'Hakua ei voi muokata koska se ei ole luonnostilassa'
      }
      return null
    })()
    const allowSave = userHasEditPrivilege && parseError === false && hakuIsDraft
    const formHasBeenEdited = (formDraftJson && avustushaku.formContent) && !_.isEqual(parsedForm, avustushaku.formContent)
    const disableSave = !allowSave || !formHasBeenEdited

    return <div className="form-json-editor">
        <h3>Hakulomakkeen sisältö</h3>
        <div className="btn-fixed-container">
          {saveDisabledError && <span>{saveDisabledError}</span>}
          <button className="btn-fixed" type="button" onClick={scrollToTop}>Takaisin ylös</button>
          <button id="saveForm" className="btn-fixed" type="button" disabled={disableSave} onClick={onClick}>Tallenna</button>
        </div>
        <span className="error" data-test-id='form-error-state'>{parseError}</span>
        <textarea onChange={onChange} disabled={!userHasEditPrivilege || avustushaku.status === "published"} value={formDraftJson}/>
      </div>
  }
}
