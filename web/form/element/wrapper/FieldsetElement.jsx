import React from 'react'

export default class FieldsetElement extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <fieldset id={htmlId}>
        {children}
      </fieldset>
    )
  }
}