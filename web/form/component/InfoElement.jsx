import React from 'react'
import moment from 'moment-timezone'

import ComponentFactory from '../ComponentFactory.js'
import LocalizedString from './LocalizedString.jsx'
import Translator from './../Translator.js'
import {InfoElementPropertyMapper, AccordionElementPropertyMapper} from './PropertyMapper.js'

class BasicInfoComponent extends React.Component {
  static asDateString(date) {
    return moment(date).tz('Europe/Helsinki').format('D.M.YYYY')
  }

  static asTimeString(date) {
    return moment(date).tz('Europe/Helsinki').format('H.mm')
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

class TextInfoComponent extends React.Component {
  textValue() {
    const lang = this.props.lang
    if (this.props.translations && this.props.translations.text != undefined) {
      return new Translator(this.props.translations).translate('text', lang)
    } else {
      return new Translator(this.props.values).translate(this.props.htmlId, lang)
    }
  }
}

export class H1InfoElement extends TextInfoComponent {
  render() {
    const text = this.textValue()
    return <h1>{text}</h1>
  }
}

export class ParagraphInfoElement extends TextInfoComponent {
  render() {
    const text = this.textValue()
    return <p className="soresu-info-element">{text}</p>
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
    const labelSource = this.labelSourceObject()

    return (
      <div>
      <label><LocalizedString translations={labelSource} translationKey="label" lang={lang}/></label>
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
        <label><LocalizedString translations={labelSource} translationKey="label" lang={lang}/></label>
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
      "p": ParagraphInfoElement,
      "bulletList": AccordionInfoElement,
      "dateRange": DateRangeInfoElement,
      "endOfDateRange": EndOfDateRangeInfoElement
    }
    this.fieldPropertyMapping = {
      "h1": InfoElementPropertyMapper,
      "p": InfoElementPropertyMapper,
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
