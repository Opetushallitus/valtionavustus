import React from 'react'
import Form from './Form.jsx'
import FormPreview from './FormPreview.jsx'
import ChangeLanguageButton from './ChangeLanguageButton.jsx'
import LocalizedString from './LocalizedString.jsx'

export default class FormContainer extends React.Component {

  render() {
    var form = this.props.form
    var lang = this.props.lang
    var model = this.props.model
    var values = this.props.values
    var formElement;
    if (this.props.preview) {
      formElement = <FormPreview model={model} form={form} lang={lang} values={values}/>
    } else {
      formElement = <Form model={model} form={form} lang={lang} values={values}/>
    }

    return (
        <section>
          <ChangeLanguageButton model={model} lang={lang} id="fi" label="Suomeksi" />
          <ChangeLanguageButton model={model} lang={lang} id="sv" label="På svenska" />
          <h1><LocalizedString data={form.content.name} lang={lang}/></h1>
          {formElement}
        </section>
    )
  }
}
