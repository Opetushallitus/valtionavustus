import React from "react"

export default class ModalDialog extends React.Component {
  render() {
    return this.props.isOpen ? (
      <div className={this.props.overlayClassName}>
        <div className={this.props.className}>
          {this.props.children}
        </div>
      </div>
    ) : <div />
  }
}

