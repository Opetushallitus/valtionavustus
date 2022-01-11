import React from 'react'
import ClassNames from 'classnames'

import RemoveButton from 'soresu-form/web/form/component/RemoveButton.jsx'

export default class VaProjectDescription extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const removeButton = React.createElement(RemoveButton, this.props)
    const className = ClassNames("va-big-fieldset", { disabled: this.props.disabled })
    return (
      <li className={className}>
        <fieldset id={htmlId}>
          <div className="fieldset-elements">
            {children}
          </div>
          <div className="fieldset-control">
            {removeButton}
          </div>
        </fieldset>
      </li>
    )
  }
}
