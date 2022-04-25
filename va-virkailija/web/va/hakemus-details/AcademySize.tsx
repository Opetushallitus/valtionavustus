import React from 'react'
import _ from 'lodash'
import * as Bacon from 'baconjs'

import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import HakemustenArviointiController from '../HakemustenArviointiController'

type AcademySizeProps = {
  avustushaku: Avustushaku
  controller: HakemustenArviointiController
  hakemus: Hakemus
  allowEditing?: boolean
}

type AcademySizeState = {
  currentHakemusId: number
  invalid: boolean
  value: string
}

export default class AcademySize extends React.Component<AcademySizeProps, AcademySizeState> {
  changeBus: Bacon.Bus<[a: Hakemus, b: number]>

  constructor(props: AcademySizeProps) {
    super(props)
    this.state = AcademySize.initialState(props)
    this.changeBus = new Bacon.Bus()
    this.changeBus.debounce(1000).onValue(([hakemus, value]) => { this.props.controller.setHakemusAcademysize(hakemus, value) })
  }

  static getDerivedStateFromProps(props: AcademySizeProps, state: AcademySizeState) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return AcademySize.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props: AcademySizeProps){
    const value = _.get(props.hakemus, "arvio.academysize") || 0
    return {
      currentHakemusId: props.hakemus.id,
      value: value,
      invalid: false
    }
  }

  render() {
    const {avustushaku, hakemus, allowEditing} = this.props
    if (!avustushaku.is_academysize) {
      return null
    }
    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      this.setState({value: value})
      const valueInt = parseInt(value)
      if(value.length>0){
        this.setState({invalid:isNaN(valueInt)})
      }
      if(valueInt){
        this.changeBus.push([hakemus, valueInt])
      }
    }
    return (
      <div className="hakemus-arviointi-section hakemus-arviointi-section--academy-size">
        <label>Oppilaitoksen koko:</label>
        <input type="number" className={this.state.invalid ? 'error input-number-sm' : 'input-number-sm'} value={this.state.value} onChange={onChange} disabled={!allowEditing}/>
      </div>
    )
  }
}
