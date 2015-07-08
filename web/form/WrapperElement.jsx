import React from 'react'
import Translator from './Translator.js'
import LocalizedString from './LocalizedString.jsx'
import _ from 'lodash'

class ThemeWrapperElement extends React.Component {
  render() {
    const field = this.props.field
    const lang = this.props.lang
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
        <section className="theme" id={htmlId}>
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
    const htmlId = this.props.htmlId
    return (
        <fieldset id={htmlId}>
          {children}
        </fieldset>
    )
  }
}

class GrowingFieldsetElement extends React.Component {
  render() {
    const field = this.props.field
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <fieldset id={htmlId}>
        <ol>
          {children}
        </ol>
      </fieldset>
    )
  }
}

class GrowingFieldsetChildElement extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const renderingParameters = this.props.renderingParameters
    const removalCallback = renderingParameters && !this.props.disabled ? renderingParameters.removeMe : function() {}
    const removeAltText = new Translator(this.props.translations["misc"]).translate("remove", this.props.lang, "POISTA")
    const mustNotBeRemoved = _.isObject(renderingParameters) ? renderingParameters.rowMustNotBeRemoved : false
    return (
      <li>
        <fieldset id={htmlId}>
          {children}
          <button
            className="remove"
            alt={removeAltText}
            title={removeAltText}
            onClick={removalCallback}
            disabled={this.props.disabled || mustNotBeRemoved ? "disabled" : ""}/>
        </fieldset>
      </li>
    )
  }
}

export default class WrapperElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "theme": ThemeWrapperElement,
      "fieldset": FieldsetElement,
      "growingFieldset": GrowingFieldsetElement,
      "growingFieldsetChild": GrowingFieldsetChildElement
    }
  }

  render() {
    const field = this.props.field;
    const displayAs = field.displayAs
    const model = this.props.model

    var element = <span>WrapperElement: Unsupported field type {displayAs}</span>

    if (displayAs in model.getCustomComponentTypeMapping()) {
      element = model.createCustomComponent(this.props)
    } else if (displayAs in this.fieldTypeMapping) {
      element = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }
    return element
  }
}
