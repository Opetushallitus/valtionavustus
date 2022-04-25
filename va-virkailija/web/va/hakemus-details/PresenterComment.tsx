import React from 'react'
import _ from 'lodash'
import * as Bacon from 'baconjs'

import { Hakemus } from 'soresu-form/web/va/types'

import HelpTooltip from '../HelpTooltip'
import HakemustenArviointiController from '../HakemustenArviointiController'

type PresenterCommentProps = {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  helpText: string
}

type PresenterCommentState = {
  currentHakemusId: number
  value: string
}

export default class PresenterComment extends React.Component<PresenterCommentProps, PresenterCommentState> {
  changeBus: Bacon.Bus<[a: Hakemus, b: string]>

  constructor(props: PresenterCommentProps) {
    super(props)
    this.state = PresenterComment.initialState(props)
    this.changeBus = new Bacon.Bus()
    this.changeBus.debounce(1000).onValue(([hakemus, value]) => { this.props.controller.setPresenterComment(hakemus, value) })
  }

  static getDerivedStateFromProps(props: PresenterCommentProps, state: PresenterCommentState) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return PresenterComment.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props: PresenterCommentProps) {
    const value = _.get(props.hakemus, "arvio.presentercomment") || ""
    return {
      currentHakemusId: props.hakemus.id,
      value: value
    }
  }

  render() {
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>)=> {
      const value = e.target.value
      this.setState({value: value})
      this.changeBus.push([this.props.hakemus, value])
    }
    return (
      <div className="value-edit">
        <label>Valmistelijan huomiot <HelpTooltip content={this.props.helpText} direction={"valmistelijan-huomiot"} /> </label>
        <textarea rows={5} value={this.state.value} onChange={onChange}></textarea>
      </div>
    )
  }
}
