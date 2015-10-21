import React, { Component } from 'react'
import Immutable from 'seamless-immutable'

import styles from '../style/formedit.less';

import FormEdit from 'soresu-form/web/form/edit/FormEdit.jsx'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'

import FakeFormController from '../form/FakeFormController.js'
import FakeFormState from '../form/FakeFormState.js'

export default class FormEditor extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const hakuAdminController = this.props.controller
    const formEditorController = new FormEditorController({ onRemove: hakuAdminController.onRemoveField })
    const formState = avustushaku.formContent ? FakeFormState.createEditFormState(translations, avustushaku) : undefined
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
}

/**
 * TODO: Maybe generalise and move this to soresu-form ?
 */
class FormEditorController {
  constructor(operations) {
    this.onRemoveCallback = operations.onRemove
  }

  removeField(field) {
    console.log('I am the initial FormEditorController, supposed to remove', field)
    this.onRemoveCallback(field)
  }
}