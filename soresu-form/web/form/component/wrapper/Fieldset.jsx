import { Component } from 'react';

export default class Fieldset extends Component {
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
