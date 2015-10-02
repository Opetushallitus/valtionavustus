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
    return formDraft ?
      <div id="form-json-editor"><h3>Lomake</h3>
        <button disabled={avustushaku.status === "published"} onClick={onClick}>Tallenna lomake</button>
        <textarea onChange={onChange} disabled={avustushaku.status === "published"} value={formDraft}/>
      </div>
      : <span/>
  }
}
