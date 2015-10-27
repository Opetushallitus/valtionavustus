import React, { Component } from 'react'

import FormEditor from './FormEditor.jsx'
import FormJsonEditor from './FormJsonEditor.jsx'

export default class FormEditorContainer extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const translations = this.props.translations
    const formDraft = this.props.formDraft
    const controller = this.props.controller
    return <section>
             <FormEditor avustushaku={avustushaku} translations={translations} formDraft={formDraft} controller={controller} />
             <FormJsonEditor controller={controller} avustushaku={avustushaku} formDraft={formDraft} />
           </section>
  }
}
