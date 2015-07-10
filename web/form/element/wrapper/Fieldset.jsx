import React from 'react'

export default class Fieldset extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <fieldset className="soresu-fieldset" id={htmlId}>
        {children}
      </fieldset>
    )
  }
}