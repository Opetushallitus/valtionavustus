import React from 'react'

export default class FieldsetPreview extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <div className="soresu-preview-fieldset" id={htmlId}>
        {children}
      </div>
    )
  }
}