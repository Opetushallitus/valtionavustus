import React, { Component } from 'react'
import { AvustushakuPhase } from 'soresu-form/web/va/types'

interface Props {
  phase: AvustushakuPhase
}

export default class HakuPhase extends Component<Props> {
  render() {
    const phase = this.props.phase
    let value: string = phase
    switch (phase) {
      case 'upcoming':
        value = 'Aukeamassa'
        break
      case 'current':
        value = 'Auki'
        break
      case 'ended':
        value = 'Päättynyt'
        break
      case 'unpublished':
        value = 'Kiinni'
        break
    }
    return <span className={phase}>{value}</span>
  }
}
