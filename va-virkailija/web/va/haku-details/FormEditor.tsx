import React from 'react'

import 'va-common/web/va/style/soresu-va.less'
import 'soresu-form/web/form/style/formedit.less'
import FormEdit from 'soresu-form/web/form/edit/FormEdit.jsx'
import FormEditorController from 'soresu-form/web/form/edit/FormEditController'
import VaComponentFactory from 'va-common/web/va/VaComponentFactory'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'

import FakeFormController from '../form/FakeFormController'
import FakeFormState from '../form/FakeFormState'
import { FormikHook } from 'va-common/web/va/standardized-form-fields/types'
import { StandardizedFormFields } from './StandardizedFormFields'

function parseJson(string) {
  try {
    return JSON.parse(string)
  } catch (e) {
    return false
  }
}

interface FormEditorProps { 
  avustushaku: any
  environment: any
  translations: any
  koodistos: any 
  formDraft: any 
  onFormChange: any 
  controller: any
  f: FormikHook
}

export const FormEditor = (props: FormEditorProps) => {
  const {
    avustushaku,
    translations,
    koodistos,
    formDraft,
    onFormChange,
    environment,
    controller: hakuAdminController,
    f
  } = props

  const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
  const formDraftJson = parseJson(formDraft)
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
    readOnlyNotificationText: "Käyttäjätunnuksellasi ei ole oikeuksia muokata tätä hakua. Haun valmistelija voi lisätä sinulle oikeudet."})
  const formState = formDraftJson
    ? FakeFormState.createEditFormState(avustushaku, translations, formDraftJson.content)
    : undefined
  if (formState) {
    formState.koodistos = koodistos
    formState.koodistosLoader = hakuAdminController.ensureKoodistosLoaded
  }
  const formElementProps = {
    state: formState,
    infoElementValues: avustushaku,
    controller: new FakeFormController(new VaComponentFactory(), new VaPreviewComponentFactory(), avustushaku, {}),
    formEditorController: formEditorController,
  }

  return formState ?
    <div id="form-editor">
    <StandardizedFormFields f={f} environment={environment}/>
      <FormEdit {...formElementProps} />
    </div> : <span/>
}
