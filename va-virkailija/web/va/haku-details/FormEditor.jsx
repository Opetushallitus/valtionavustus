import React, { Component } from 'react'
import Immutable from 'seamless-immutable'

import styles from '../style/formedit.less';

import FormEdit from 'soresu-form/web/form/edit/FormEdit.jsx'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'
import FormUtil from 'soresu-form/web/form/FormUtil'

import FakeFormController from '../form/FakeFormController.js'
import FakeFormState from '../form/FakeFormState.js'

export default class FormEditor extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const hakuAdminController = this.props.controller
    const formDraftJson = this.parseJson(this.props.formDraft)
    const formEditedCallback = (newDraftJson, field) => {
      hakuAdminController.formOnChangeListener(avustushaku, newDraftJson)
    }
    const formEditorController = new FormEditorController({
      formDraftJson: formDraftJson,
      onFormEdited: formEditedCallback })
    const formState = formDraftJson ? FakeFormState.createEditFormState(translations, formDraftJson) : undefined
    const formElementProps = {
      state: formState,
      infoElementValues: avustushaku,
      controller: new FakeFormController(new VaPreviewComponentFactory(), avustushaku, {}),
      formEditorController: formEditorController
    }

    return formState ?
      <div id="form-editor">
        <h3>Hakulomakkeen muokkaus</h3>
        <FormEdit {...formElementProps} />
      </div> : <span/>
  }

  parseJson(string) {
    try {
      return JSON.parse(string)
    } catch (e) {
      return false
    }
  }
}

/**
 * TODO: Maybe generalise and move this to soresu-form ?
 */
class FormEditorController {
  constructor(props) {
    this.formDraftJson = props.formDraftJson
    this.onEditCallback = props.onFormEdited
  }

  removeField(field) {
    const parent = FormUtil.findFieldWithDirectChild(this.formDraftJson.content, field.id)
    _.remove(parent.children, c => { return c.id === field.id })
    this.onEditCallback(JSON.stringify(this.formDraftJson, null, 2), field)
  }
}