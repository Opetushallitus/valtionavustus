import React from 'react'
import RemoveButton from '../RemoveButton.jsx'

export default class GrowingFieldsetChild extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const removeButton = React.createElement(RemoveButton, this.props)
    return (
      <li>
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