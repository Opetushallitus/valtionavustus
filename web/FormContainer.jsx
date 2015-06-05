import React from 'react'
import Form from './Form.jsx'
import FormPreview from './FormPreview.jsx'
import ChangeLanguageButton from './ChangeLanguageButton.jsx'
import LocalizedString from './LocalizedString.jsx'

export default class FormContainer extends React.Component {

  render() {
    const form = this.props.form
    const lang = this.props.lang
    const model = this.props.model
    const values = this.props.values
    const validationErrors = this.props.validationErrors
    const translations = this.props.translations
    var formElement;
    if (this.props.preview) {
      formElement = <FormPreview model={model} form={form} lang={lang} values={values} valuesId={this.props.valuesId}/>
    } else {
      formElement = <Form model={model} validationErrors={validationErrors} translations={translations} form={form} lang={lang} values={values} valuesId={this.props.valuesId}/>
    }

    return (
        <section>
          <ChangeLanguageButton model={model} lang={lang} id="fi" label="Suomeksi" />
          <ChangeLanguageButton model={model} lang={lang} id="sv" label="På svenska" />
          <h1><LocalizedString translations={form.content} translationKey="name" lang={lang}/></h1>
          {formElement}
        </section>
    )
  }
}
