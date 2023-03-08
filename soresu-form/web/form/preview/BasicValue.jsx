import React from 'react'
import PreviewComponent from './PreviewComponent.jsx'

const empty = '\u00a0'

const renderWithNewLines = (value) => value.split('\n').map((x, i) => <div key={i}>{x}</div>)

export default class BasicValue extends PreviewComponent {
  render() {
    return super.render(
      <span className="soresu-value" id={this.props.htmlId}>
        {this.props.value ? renderWithNewLines(this.props.value) : empty}
      </span>
    )
  }
}
