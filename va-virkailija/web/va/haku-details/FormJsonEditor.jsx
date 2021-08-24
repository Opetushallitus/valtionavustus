import React from 'react'
import _ from 'lodash'

export default class FormJsonEditor extends React.Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const formDraft = this.props.formDraft
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const hakuIsDraft = avustushaku.status === "draft"

    const onChange = e => {
      controller.formOnChangeListener(avustushaku, e.target.value)
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
    const formHasBeenEdited = (formDraft && avustushaku.formContent) && !_.isEqual(parsedForm, avustushaku.formContent)
    const disableSave = !allowSave || !formHasBeenEdited

    return formDraft ?
      <div className="form-json-editor">
        <h3>Hakulomakkeen sisältö</h3>
        <div className="btn-fixed-container">
          {saveDisabledError && <span>{saveDisabledError}</span>}
          <button className="btn-fixed" type="button" onClick={scrollToTop}>Takaisin ylös</button>
          <button id="saveForm" className="btn-fixed" type="button" disabled={disableSave} onClick={onClick}>Tallenna</button>
        </div>
        <span className="error">{parseError}</span>
        <textarea onChange={onChange} disabled={!userHasEditPrivilege || avustushaku.status === "published"} value={formDraft}/>
      </div>
      : <span/>
  }
}
