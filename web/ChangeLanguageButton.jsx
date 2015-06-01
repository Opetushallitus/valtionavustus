import React from 'react'

export default class ChangeLanguageButton extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    var thisLang = this.props.id
    var model = this.props.model
    var handleClick = function() {
      model.changeLanguage(thisLang)
    }
    return (<button type="button" id={thisLang} disabled={this.props.lang === thisLang} onClick={handleClick}>{this.props.label}</button>)
  }
}
