import React from 'react'
import LocalizedString from './LocalizedString.jsx'

class H1InfoElement extends React.Component {
  render() {
    const values = this.props.values
    const key = this.props.field.id
    const field = this.props.field
    const lang = this.props.lang
    return <h1><LocalizedString translations={values} translationKey={key} lang={lang}/></h1>
  }
}

class BulletListInfoElement extends React.Component {
  render() {
    const values = this.props.values
    const key = this.props.field.id
    const field = this.props.field
    const lang = this.props.lang
    const items = []
    for (var i=0; i < values[key].length; i++) {
      const textContent = values[key][i][this.props.lang]
      items.push((<li key={key + "." + i}>{textContent}</li>))
    }
    return (<div><ul id={field.id}><LocalizedString translations={field} translationKey="label" lang={lang}/>
                {items}
            </ul></div>)
  }
}

export default class InfoElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "h1": H1InfoElement,
      "bulletList": BulletListInfoElement
    }
  }

  render() {
    const field = this.props.field;
    const displayAs = field.displayAs
    const values = this.props.values
    const lang = this.props.lang

    console.log("Rendering info element", field)
    var element = <span>Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      element = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }
    return element
  }
}
