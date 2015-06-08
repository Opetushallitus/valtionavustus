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
    const model = this.props.model
    const handleClick = function() {
      model.changeLanguage(nextLang)
    }
    return (<button type="button" id={this.props.id} onClick={handleClick}>{nextLangLabel}</button>)
  }
}
