import React from 'react'

export default class ChangeLanguageButton extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    const thisLang = this.props.id
    const model = this.props.model
    const handleClick = function() {
      model.changeLanguage(thisLang)
    }
    return (<button type="button" id={thisLang} disabled={this.props.lang === thisLang} onClick={handleClick}>{this.props.label}</button>)
  }
}
