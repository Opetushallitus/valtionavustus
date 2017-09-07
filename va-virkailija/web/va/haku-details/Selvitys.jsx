import React, { Component } from 'react'
import moment from 'moment'
import _ from 'lodash'

export default class Selvitys extends React.Component{
  render(){
    const {controller, avustushaku} = this.props
    return (
      <div>
        <h4>Väliselvitys</h4>
        <div>
          Väliselvitys toimitettava viimeistään
          <DateField {...this.props} field="valiselvitysdate"/>
          <div>Väliselvitys avautuu täytettäväksi kun väliselvityspyyntö on lähetetty</div>
        </div>
        <h4>Loppuselvitys</h4>
        <div>
          Loppuselvitys toimitettava viimeistään

          <DateField {...this.props} field="loppuselvitysdate"/>
          <div>Loppuselvityslomake on koko ajan täytettävissä.</div>
        </div>
      </div>
    )
  }
}


class DateField extends React.Component {
  constructor(props) {
    super(props)
    this.state = {value: this.value(props, props.field)}
    this.onChange = this.onChange.bind(this)
    this.onBlur = this.onBlur.bind(this)
  }

  value(props, field) {
    return props.avustushaku[field] || ""
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.avustushaku.id != this.props.avustushaku.id) {
      this.setState({value: this.value(nextProps, nextProps.field)})
    }
  }

  onChange(event) {
    this.setState({value: event.target.value, invalid: false})
  }

  onBlur(event) {
    const value = event.target.value
    const isValid = moment(value, ["D.M.YYYY"], true).isValid() || value == ""
    if (isValid) {
      this.props.controller.onChangeListener(this.props.avustushaku, event.target, value)
    } else {
      this.setState({invalid: true})
    }
  }

  render() {
    return (
      <span className="decision-date" style={{marginLeft: 10, marginRight: 10}}>
        <input type="text"
               placeholder="p.k.vvvv"
               className={this.state.invalid ? 'error' : ''}
               value={this.state.value}
               id={this.props.field}
               onChange={this.onChange}
               onBlur={this.onBlur}/>
      </span>
    )
  }
}
