import React, { Component } from 'react'

import vaCommonStyles from 'va-common/web/va/style/soresu-va.less';
import soresuFormEditStyles from 'soresu-form/web/form/style/formedit.less';

import FormEdit from 'soresu-form/web/form/edit/FormEdit.jsx'
import FormEditorController from 'soresu-form/web/form/edit/FormEditController'
import VaComponentFactory from 'va-common/web/va/VaComponentFactory'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'

import FakeFormController from '../form/FakeFormController.js'
import FakeFormState from '../form/FakeFormState.js'

export default class FormEditor extends Component {
  render() {
    const {avustushaku, translations, koodistos, formDraft, onFormChange} = this.props
    const hakuAdminController = this.props.controller
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const formDraftJson = this.parseJson(formDraft)
    const formEditedCallback = (newDraftJson, operationResult) => {
      if (operationResult && operationResult.fieldType === "koodistoField") {
        hakuAdminController.ensureKoodistosLoaded()
      }
      onFormChange(avustushaku, newDraftJson)
    }
    const formEditorController = new FormEditorController({
      formDraftJson: formDraftJson,
      onFormEdited: formEditedCallback,
      allowEditing: userHasEditPrivilege,
      readOnlyNotificationText: "Käyttäjätunnuksellasi ei ole oikeuksia muokata tätä hakua. Haun esittelijä voi lisätä sinulle oikeudet."})
    const formState = formDraftJson ? FakeFormState.createEditFormState(translations, formDraftJson) : undefined
    if (formState) {
      formState.koodistos = koodistos
      formState.koodistosLoader = hakuAdminController.ensureKoodistosLoaded
    }
    const formElementProps = {
      state: formState,
      infoElementValues: avustushaku,
      controller: new FakeFormController(new VaComponentFactory(), new VaPreviewComponentFactory(), avustushaku, {}),
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
