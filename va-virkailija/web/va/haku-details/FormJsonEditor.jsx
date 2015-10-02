import React, { Component } from 'react'

export default class FormJsonEditor extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    return avustushaku.form ?
      <div id="form-json-editor"><h3>Lomake</h3>
        <textarea disabled={avustushaku.status === "published"} value={JSON.stringify(avustushaku.formContent, undefined, 2)}/>
      </div>
      : <span/>
  }
}
