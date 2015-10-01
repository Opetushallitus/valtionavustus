import React from 'react'
import _ from 'lodash'
import Translator from '../Translator'

export default class RemoveButton extends React.Component {
  render() {
    const props = this.props
    const renderingParameters = this.props.renderingParameters
    const mustNotBeRemoved = _.isObject(renderingParameters) ? renderingParameters.rowMustNotBeRemoved : false
    const removalCallback = function(event) {
      event.preventDefault()
      if (renderingParameters && !props.disabled) {
        renderingParameters.removeMe()
      }
    }
    const removeAltText = new Translator(props.translations["misc"]).translate("remove", props.lang, "POISTA")
    return (<button className="soresu-remove"
                    tabIndex="-1"
                    alt={removeAltText}
                    title={removeAltText}
                    onClick={removalCallback}
                    disabled={props.disabled || mustNotBeRemoved} />
    )
  }
}
