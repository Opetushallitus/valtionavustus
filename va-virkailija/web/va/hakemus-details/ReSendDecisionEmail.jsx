import React, { Component } from 'react'
import HttpUtil from 'soresu-form/web/HttpUtil'

export default class ReSendDecisionEmail extends Component {

  constructor(props){
    super(props)
    this.state = {submitting: false, submitted: false}
  }

  render() {
    const {avustushaku, hakemus} = this.props
    const avustushakuId = avustushaku.id
    const hakemusId = hakemus.id
    const isResolved = this.props.hakuData.avustushaku.status === "resolved"
    const onSubmit = () => {
      if (confirm('Oletko varma, että haluat lähettää hakijalle sähköpostin uudestaan?')) {
          this.setState({submitting: true})
          const url = `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/re-send-paatos`
          HttpUtil.post(url).then(() => {
            this.setState({submitting: false, submitted: true})
          })}
      }


    return (
      <div className="value-edit">
        {isResolved &&
          <div>
            <button onClick={onSubmit} disabled={this.state.submitting}>Lähetä päätössähköposti uudestaan</button>
            {this.state.submitted && <span>Sähköposti lähetetty</span>}
          </div>
        }
      </div>
    )
  }
}
