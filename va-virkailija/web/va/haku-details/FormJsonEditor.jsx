import React, { Component } from 'react'

export default class FormJsonEditor extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const formDraft = this.props.formDraft
    const onChange = e => {
      controller.formOnChangeListener(avustushaku, e.target.value)
    }
    return avustushaku.form ?
      <div id="form-json-editor"><h3>Lomake</h3>
        <textarea onChange={onChange} disabled={avustushaku.status === "published"} value={formDraft}/>
      </div>
      : <span/>
  }
}
