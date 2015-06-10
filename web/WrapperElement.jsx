import React from 'react'
import LocalizedString from './LocalizedString.jsx'

class ThemeWrapperElement extends React.Component {
  render() {
    const field = this.props.field
    const key = field.id
    const lang = this.props.lang
    const children = this.props.children
    return (
        <section className="theme">
         <h2><LocalizedString translations={field} translationKey="label" lang={lang}/></h2>
          {children}
        </section>
    )
  }
}

export default class WrapperElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "theme": ThemeWrapperElement
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
