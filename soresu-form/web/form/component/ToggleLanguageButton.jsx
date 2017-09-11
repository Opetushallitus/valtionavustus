import React from 'react'

export default class ToggleLanguageButton extends React.Component {
  render() {
    var nextLang;
    var nextLangLabel;
    for (var key in this.props.languages) {
      if (this.props.lang !== key) {
        nextLang = key
        nextLangLabel = this.props.languages[key]
      }
    }
    const controller = this.props.controller
    const handleClick = function() {
      controller.changeLanguage(nextLang)
    }
    return (<button type="button" className="soresu-text-button" id={this.props.id} onClick={handleClick}>{nextLangLabel}</button>)
  }
}
