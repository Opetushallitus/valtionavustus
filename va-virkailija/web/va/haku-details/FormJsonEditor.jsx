import React from 'react'
import _ from 'lodash'

export default class FormJsonEditor extends React.Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const formDraft = this.props.formDraft
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const onChange = e => {
      controller.formOnChangeListener(avustushaku, e.target.value)
    }
    const onClick = () => {
      controller.saveForm(avustushaku, formDraft)
    }

    let parsedForm = formDraft
    let parseError = false
    try {
      parsedForm = JSON.parse(formDraft)
    } catch (error) {
      parseError = error.toString()
    }
    const disableSave = !allowSave() || !formHasBeenEdited()

    return formDraft ?
      <div className="form-json-editor"><h3>Hakulomakkeen sisältö</h3>
        <button className="btn-fixed" type="button" disabled={disableSave} onClick={onClick}>Tallenna</button><span key="form-json-editor-error" className="error"> {parseError}</span>
        <textarea onChange={onChange} disabled={!userHasEditPrivilege || avustushaku.status === "published"} value={formDraft}/>
      </div>
      : <span/>

    function allowSave() {
      return userHasEditPrivilege && parseError === false && avustushaku.status === "draft"
    }

    function formHasBeenEdited() {
      return (formDraft && avustushaku.formContent) && !_.isEqual(parsedForm, avustushaku.formContent)
    }
  }
}
