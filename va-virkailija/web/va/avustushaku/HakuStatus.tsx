import React from 'react'
import { AvustushakuStatus } from 'soresu-form/web/va/types'

type HakuStatusProps = {
  status: AvustushakuStatus
}

type HakuStatusState = never

export default class HakuStatus extends React.Component<HakuStatusProps, HakuStatusState> {
  render() {
    const status = this.props.status
    let value: string = status
    switch (status) {
      case 'new':
        value = 'Uusi'
        break
      case 'draft':
        value = 'Luonnos'
        break
      case 'published':
        value = 'Julkaistu'
        break
      case 'resolved':
        value = 'Ratkaistu'
        break
      case 'deleted':
        value = 'Poistettu'
        break
    }
    return <span className={status}>{value}</span>
  }
}
