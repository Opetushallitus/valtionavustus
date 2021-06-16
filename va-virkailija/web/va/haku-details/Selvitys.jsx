import React from 'react'
import moment from 'moment'
import HelpTooltip from '../HelpTooltip.jsx'
import { fiShortFormat } from 'va-common/web/va/i18n/dateformat'

export default class Selvitys extends React.Component{
  render(){
    return (
      <div>
        <h4 data-test-id="valiselvitys">Väliselvitys <HelpTooltip content={this.props.helpTexts["hakujen_hallinta__päätös___väliselvitys"]} direction="left" /> </h4>
        <div>
          Väliselvitys toimitettava viimeistään
          <DateField {...this.props} field="valiselvitysdate"/>
          <div>Väliselvitys avautuu täytettäväksi kun väliselvityspyyntö on lähetetty</div>
        </div>
        <h4 data-test-id="loppuselvitys">Loppuselvitys <HelpTooltip content={this.props.helpTexts["hakujen_hallinta__päätös___loppuselvitys"]} direction="left" /> </h4>
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
    this.state = DateField.initialState(props)
    this.onChange = this.onChange.bind(this)
    this.onBlur = this.onBlur.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.avustushaku.id !== state.currentAvustushakuId) {
      return DateField.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    return {
      currentAvustushakuId: props.avustushaku.id,
      value: DateField.value(props, props.field)
    }
  }

  static value(props, field) {
    return props.avustushaku[field] || ""
  }

  onChange(event) {
    this.setState({value: event.target.value, invalid: false})
  }

  onBlur(event) {
    const value = event.target.value
    const isValid = moment(value, [fiShortFormat], true).isValid() || value === ""
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
