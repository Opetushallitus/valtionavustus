import React from 'react'

import ComponentFactory from '../ComponentFactory.jsx'
import LocalizedString from './LocalizedString.jsx'
import Translator from '../Translator'
import DateUtil from '../../DateUtil'
import {InfoElementPropertyMapper, AccordionElementPropertyMapper, LinkPropertyMapper} from './PropertyMapper.js'

export class BasicInfoComponent extends React.Component {
  asDateTimeString(date) {
    const timeLimiter = new Translator(this.props.translations["misc"]).translate("time", this.props.lang, "KLO")
    return DateUtil.asDateString(date) + " " + timeLimiter + " " + DateUtil.asTimeString(date)
  }

  translatedValue(valueId) {
    const lang = this.props.lang
    const translations = this.props.translations
    const values = this.props.values
    const value = values[this.props.htmlId]
    if (this.props[valueId]) {
      return new Translator(this.props).translate(valueId, lang)
    } else if (translations && translations[valueId]) {
      return new Translator(translations).translate(valueId, lang)
    } else if (value && value[valueId]) {
      return new Translator(value).translate(valueId, lang)
    } else {
      return new Translator(values).translate(this.props.htmlId, lang)
    }
  }
}

export class H1InfoElement extends BasicInfoComponent {
  render() {
    return <h1>{this.translatedValue('text')}</h1>
  }
}

export class H3InfoElement extends BasicInfoComponent {
  render() {
    return <h3>{this.translatedValue('text')}</h3>
  }
}

export class LinkInfoElement extends BasicInfoComponent {
  render() {
    const translatedText = this.translatedValue('text')
    const translatedHref = this.translatedValue('href')
    const text = translatedText ? translatedText : translatedHref
    return <a hidden={!translatedHref} target="_blank" href={translatedHref}>{text}</a>
  }
}

export class ParagraphInfoElement extends BasicInfoComponent {
  render() {
    return <p className="soresu-info-element">{this.translatedValue('text')}</p>
  }
}

export class AccordionInfoElement extends BasicInfoComponent {
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

  render() {
    const values = this.props.values
    const key = this.props.htmlId
    const lang = this.props.lang
    const items = []
    const infoObject = values[this.props.htmlId]
    for (let i = 0; i < infoObject.items.length; i++) {
      const textContent = infoObject.items[i][lang]
      items.push((<li key={key + "." + i}>{textContent}</li>))
    }
    const isOpen = this.state.open
    const openStateClassName = isOpen ? "open" : "closed"
    return (
        <div>
          <span onClick={this.handleClick}
                className={"soresu-opener-handle " + openStateClassName}>
            {super.translatedValue('label')}
          </span>
          <div className="soresu-accordion"
               ref={el => {
                 if (el) {
                   // Explicitly set max-height so that hiding/showing element
                   // can be animated with css transitions. Setting max-height
                   // is slightly faster than setting height on IE11.
                   el.style.maxHeight = isOpen ? el.scrollHeight + "px" : 0
                 }
            }}>
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
    const value = values[this.props.htmlId]
    const start = new Date(value.start)
    const startDateTime = this.asDateTimeString(start)
    const end = new Date(value.end)
    const endDateTime = this.asDateTimeString(end)

    return (
      <div>
        {this.translatedValue('label')} {startDateTime} — {endDateTime}
      </div>
    )
  }
}

export class EndOfDateRangeInfoElement extends BasicInfoComponent {
  render() {
    const values = this.props.values
    const value = values[this.props.htmlId]
    const end = new Date(value.end)
    const endDateTime = this.asDateTimeString(end)
    return (
      <div>
        <label>{this.translatedValue('label')}</label>
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
      "h3": H3InfoElement,
      "link": LinkInfoElement,
      "p": ParagraphInfoElement,
      "bulletList": AccordionInfoElement,
      "dateRange": DateRangeInfoElement,
      "endOfDateRange": EndOfDateRangeInfoElement
    }
    const fieldPropertyMapping = {
      "h1": InfoElementPropertyMapper,
      "h3": InfoElementPropertyMapper,
      "link": LinkPropertyMapper,
      "p": InfoElementPropertyMapper,
      "bulletList": AccordionElementPropertyMapper,
      "dateRange": InfoElementPropertyMapper,
      "endOfDateRange": InfoElementPropertyMapper
    }
    this.componentFactory = new ComponentFactory({ fieldTypeMapping: fieldTypeMapping, fieldPropertyMapperMapping: fieldPropertyMapping })
  }


  render() {
    const controller = this.props.controller
    const fieldType = this.props.fieldType

    if (fieldType in controller.getCustomComponentTypeMapping()) {
      return controller.createCustomComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}
