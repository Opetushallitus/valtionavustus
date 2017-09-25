import React from "react"

export default class ModalDialog extends React.Component {
  render() {
    return this.props.isOpen ? (
      <div className={`modal-dialog-overlay ${this.props.overlayClassName}`}>
        <div className={`modal-dialo-content ${this.props.className}`}>
          {this.props.children}
        </div>
      </div>
    ) : <div />
  }
}

