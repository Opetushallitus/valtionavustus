import React from 'react'
import _ from 'lodash'

import LocalizedString from 'va-common/web/form/component/LocalizedString.jsx'

/**
 * Button that is not bound to any form field.
 */
export default class TextButton extends React.Component {
  render() {
    const props = this.props
    const type = this.props.type ? this.props.type : "button"
    return <button id={props.htmlId}
                   className="soresu-text-button"
                   type={type}
                   onClick={props.onClick}
                   disabled={props.disabled}>
             <LocalizedString translations={props.translations}
                              translationKey={props.translationKey}
                              lang={props.lang} />
           </button>
  }
}