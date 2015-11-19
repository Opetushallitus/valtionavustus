import React, { Component } from 'react'

import vaCommonStyles from 'va-common/web/va/style/soresu-va.less';
import soresuFormEditStyles from 'soresu-form/web/form/style/formedit.less';

import FormEdit from 'soresu-form/web/form/edit/FormEdit.jsx'
import FormEditorController from 'soresu-form/web/form/edit/FormEditController'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'

import FakeFormController from '../form/FakeFormController.js'
import FakeFormState from '../form/FakeFormState.js'

export default class FormEditor extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const hakuAdminController = this.props.controller
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const formDraftJson = this.parseJson(this.props.formDraft)
    const formEditedCallback = (newDraftJson) => {
      hakuAdminController.formOnChangeListener(avustushaku, newDraftJson)
    }
    const formEditorController = new FormEditorController({
      formDraftJson: formDraftJson,
      onFormEdited: formEditedCallback,
      allowEditing: userHasEditPrivilege })
    const formState = formDraftJson ? FakeFormState.createEditFormState(translations, formDraftJson) : undefined
    const formElementProps = {
      state: formState,
      infoElementValues: avustushaku,
      controller: new FakeFormController(new VaPreviewComponentFactory(), avustushaku, {}),
      formEditorController: formEditorController
    }

    return formState ?
      <div id="form-editor">
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
