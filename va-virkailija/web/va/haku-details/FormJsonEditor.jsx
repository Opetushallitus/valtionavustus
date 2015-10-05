import React, { Component } from 'react'

export default class FormJsonEditor extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const formDraft = this.props.formDraft
    const onChange = e => {
      controller.formOnChangeListener(avustushaku, e.target.value)
    }
    const onClick = e => {
      controller.saveForm(avustushaku, formDraft)
    }

    const formHasBeenEdited = (formDraft && avustushaku.formContent) && !_.isEqual(JSON.parse(formDraft), avustushaku.formContent)
    const disableSave = !formHasBeenEdited || avustushaku.status === "published"

    return formDraft ?
      <div id="form-json-editor"><h3>Hakulomakkeen sisältö</h3>
        <textarea onChange={onChange} disabled={avustushaku.status === "published"} value={formDraft}/>
        <button disabled={disableSave} onClick={onClick}>Tallenna hakulomakkeen muutokset</button>
      </div>
      : <span/>
  }
}
