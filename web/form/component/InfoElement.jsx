import React from 'react'

import ComponentFactory from '../ComponentFactory.js'
import LocalizedString from './LocalizedString.jsx'
import Translator from './../Translator.js'
import {InfoElementPropertyMapper, AccordionElementPropertyMapper} from './PropertyMapper.js'

export class BasicInfoComponent extends React.Component {
  static asDateString(date) {
    return date.toLocaleDateString("fi-FI")
  }

  static asTimeString(date) {
    const options = { hour: "numeric", minute: "numeric" }
    return date.toLocaleTimeString("fi-FI", options)
  }

  asDateTimeString(date) {
    const timeLimiter = new Translator(this.props.translations["misc"]).translate("time", this.props.lang, "KLO")
    return BasicInfoComponent.asDateString(date) + " " + timeLimiter + " " + BasicInfoComponent.asTimeString(date)
  }

  labelSourceObject() {
    const values = this.props.values
    const value = values[this.props.htmlId]

    if (this.props.translations.label != undefined) {
      return this.props.translations
    } else {
      return value
    }
  }
}

export class H1InfoElement extends React.Component {
  render() {
    const values = this.props.values
    const key = this.props.htmlId
    const lang = this.props.lang
    return <h1><LocalizedString translations={values} translationKey={key} lang={lang}/></h1>
  }
}

export class AccordionInfoElement extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.state = { open: this.props.renderingParameters.initiallyOpen }
  }

  handleClick() {
    this.setState({
      open: !this.state.open
    })
  }

  static determineCssClass(isOpen) {
    return isOpen ? "open" : "closed"
  }

  render() {
    const values = this.props.values
    const key = this.props.htmlId
    const lang = this.props.lang
    const items = []
    var infoObject = values[this.props.htmlId]
    for (var i=0; i < infoObject.items.length; i++) {
      const textContent = infoObject.items[i][this.props.lang]
      items.push((<li key={key + "." + i}>{textContent}</li>))
    }
    const accordionStateClassName = AccordionInfoElement.determineCssClass(this.state.open)
    return (
        <div>
          <LocalizedString onClick={this.handleClick} className={"accordion-title opener-handle " + accordionStateClassName} translations={infoObject} translationKey="label" lang={lang}/>
          <div className={"accordion " + accordionStateClassName}>
            <ul id={key}>
                {items}
            </ul>
          </div>
        </div>)
  }
}

export class DateRangeInfoElement extends BasicInfoComponent {
  render() {
    const values = this.props.values
    const lang = this.props.lang
    const value = values[this.props.htmlId]
    const start = new Date(value.start)
    const startDateTime = this.asDateTimeString(start)
    const end = new Date(value.end)
    const endDateTime = this.asDateTimeString(end)

    return (
      <div>
      <label><LocalizedString translations={value} translationKey="label" lang={lang}/></label>
      <span>{startDateTime} - {endDateTime}</span>
      </div>
    )
  }
}

export class EndOfDateRangeInfoElement extends BasicInfoComponent {
  render() {
    const values = this.props.values
    const lang = this.props.lang
    const value = values[this.props.htmlId]
    const end = new Date(value.end)
    const endDateTime = this.asDateTimeString(end)
    const labelSource = this.labelSourceObject()
    return (
      <div>
        <span><LocalizedString translations={labelSource} translationKey="label" lang={lang}/> </span>
        <span>{endDateTime}</span>
      </div>
    )
  }
}

export default class InfoElement extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "h1": H1InfoElement,
      "bulletList": AccordionInfoElement,
      "dateRange": DateRangeInfoElement,
      "endOfDateRange": EndOfDateRangeInfoElement
    }
    this.fieldPropertyMapping = {
      "h1": InfoElementPropertyMapper,
      "bulletList": AccordionElementPropertyMapper,
      "dateRange": InfoElementPropertyMapper,
      "endOfDateRange": InfoElementPropertyMapper
    }
    this.componentFactory = new ComponentFactory(fieldTypeMapping)
  }

  render() {
    const fieldType = this.props.fieldType
    const props = this.fieldPropertyMapping[fieldType].map(this.props)
    return this.componentFactory.createComponent(props)
  }
}
