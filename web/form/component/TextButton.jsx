import React from 'react'
import _ from 'lodash'

import LocalizedString from './LocalizedString.jsx'

export default class TextButton extends React.Component {
  render() {
    const props = this.props
    return <button id={props.htmlId}
                   className="soresu-text-button"
                   onClick={props.onClick}
                   disabled={props.disabled}>
             <LocalizedString translations={props.translations}
                              translationKey={props.translationKey}
                              lang={props.lang} />
           </button>
  }
}