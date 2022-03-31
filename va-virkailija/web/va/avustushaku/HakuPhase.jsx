import { Component } from 'react';

export default class HakuPhase extends Component {
  render() {
    const phase = this.props.phase
    let value = phase
    switch(phase) {
      case "upcoming":
        value = "Aukeamassa"
        break
      case "current":
        value = "Auki"
        break
      case "ended":
        value = "Päättynyt"
        break
      case "unpublished":
        value = "Kiinni"
        break
    }
    return (
      <span className={phase}>{value}</span>
    )
  }
}
