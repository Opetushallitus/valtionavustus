import React, { Component } from 'react'

export default class FormJsonEditor extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const formDraft = this.props.formDraft
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const onChange = e => {
      controller.formOnChangeListener(avustushaku, e.target.value)
    }
    const onClick = e => {
      controller.saveForm(avustushaku, formDraft)
    }

    var parsedForm = formDraft
    var parseError = false
    try {
      parsedForm = JSON.parse(formDraft)
    }
    catch (error) {
      parseError = error.toString()
    }
    const disableSave = !allowSave() || !formHasBeenEdited()

    return formDraft ?
      <div id="form-json-editor"><h3>Hakulomakkeen sisältö</h3>
        <button disabled={disableSave} onClick={onClick}>Tallenna hakulomakkeen muutokset</button><span key="form-json-editor-error" className="error"> {parseError}</span>
        <textarea onChange={onChange} disabled={!userHasEditPrivilege || avustushaku.status === "published"} value={formDraft}/>
      </div>
      : <span/>

    function allowSave() {
      return userHasEditPrivilege && parseError === false && avustushaku.status !== "published"
    }

    function formHasBeenEdited() {
      return (formDraft && avustushaku.formContent) && !_.isEqual(parsedForm, avustushaku.formContent)
    }
  }
}
