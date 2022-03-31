import { Component } from 'react';
import _ from 'lodash'
import * as Bacon from 'baconjs'
import HelpTooltip from '../HelpTooltip'

export default class PresenterComment extends Component {

  constructor(props) {
    super(props)
    this.state = PresenterComment.initialState(props)
    this.changeBus = new Bacon.Bus()
    this.changeBus.debounce(1000).onValue(([hakemus, value]) => { this.props.controller.setPresenterComment(hakemus, value) })
  }

  static getDerivedStateFromProps(props, state) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return PresenterComment.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    const value = _.get(props.hakemus, "arvio.presentercomment") || ""
    return {
      currentHakemusId: props.hakemus.id,
      value: value
    }
  }

  render() {
    const onChange = (e)=> {
      const value = e.target.value
      this.setState({value: value})
      this.changeBus.push([this.props.hakemus, value])
    }
    return (
      <div className="value-edit">
        <label>Valmistelijan huomiot <HelpTooltip content={this.props.helpText} direction={"valmistelijan-huomiot"} /> </label>
        <textarea rows="5" value={this.state.value} onChange={onChange}></textarea>
      </div>
    )
  }
}
