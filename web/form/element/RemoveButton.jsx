import React from 'react'
import _ from 'lodash'
import Translator from '../Translator.js'

export default class RemoveButton extends React.Component {
  render() {
    const renderingParameters = this.props.renderingParameters
    const removalCallback = renderingParameters && !this.props.disabled ? renderingParameters.removeMe : function() {}
    const removeAltText = new Translator(this.props.translations["misc"]).translate("remove", this.props.lang, "POISTA")
    const mustNotBeRemoved = _.isObject(renderingParameters) ? renderingParameters.rowMustNotBeRemoved : false
    return (<button
        className="remove"
        alt={removeAltText}
        title={removeAltText}
        onClick={removalCallback}
        disabled={this.props.disabled || mustNotBeRemoved}/>
    )
  }
}