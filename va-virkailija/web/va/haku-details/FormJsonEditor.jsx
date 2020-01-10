import Bacon from 'baconjs'
import React from 'react'
import _ from 'lodash'

export default class FormJsonEditor extends React.Component {
  constructor(props) {
    super(props)
    const formDraft = props.formDraft
    this.formDraftStream = new Bacon.Bus()
    this.formDraftStream
      .debounce(100)
      .onValue(formDraft => this.controller.formOnChangeListener(this.props.avustushaku, formDraft))
    this.state = { formDraft: formDraft }
  }

  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const formDraft = this.state.formDraft
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const onChange = e => {
      const value = e.target.value
      this.formDraftStream.push(value)
      this.setState({ formDraft: value })
    }
    const onClick = () => {
      controller.saveForm(avustushaku, formDraft)
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
    const disableSave = !allowSave() || !formHasBeenEdited()

    return formDraft ?
      <div className="form-json-editor">
        <h3>Hakulomakkeen sisältö</h3>
        <div className="btn-fixed-container">
          <button className="btn-fixed" type="button" onClick={scrollToTop}>Takaisin ylös</button>
          <button className="btn-fixed" type="button" disabled={disableSave} onClick={onClick}>Tallenna</button>
        </div>
        <span className="error">{parseError}</span>
        <textarea onChange={onChange} disabled={!userHasEditPrivilege || avustushaku.status === "published"} value={formDraft}/>
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
