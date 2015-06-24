import React from 'react'
import LocalizedString from './LocalizedString.jsx'

class ThemeWrapperElement extends React.Component {
  render() {
    const field = this.props.field
    const lang = this.props.lang
    const children = this.props.children
    return (
        <section className="theme" id={field.id}>
         <h2><LocalizedString translations={field} translationKey="label" lang={lang}/></h2>
          {children}
        </section>
    )
  }
}

class FieldsetElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    return (
        <fieldset id={field.id}>
          {children}
        </fieldset>
    )
  }
}

export default class WrapperElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "theme": ThemeWrapperElement,
      "fieldset": FieldsetElement,
      "growingFieldset": FieldsetElement
    }
  }

  render() {
    const field = this.props.field;
    const displayAs = field.displayAs

    var element = <span>Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      element = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }
    return element
  }
}
