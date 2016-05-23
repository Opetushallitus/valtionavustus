import React, {Component} from 'react'
import Bacon from 'baconjs'
import HttpUtil from 'va-common/web/HttpUtil.js'

const defaultMessage = (avustushakuName, selvitysName, name, email)=>{
  return `Hei,
Hankkeen "${avustushakuName}" ${selvitysName} on nyt käsitelty ja hyväksytty.

Terveisin,
${name}
${email}
`
}

const initState = ({selvitysType, hakuData, avustushaku}) => {
  const selvitysName = selvitysType=='valiselvitys' ? 'väliselvitys' : 'loppuselvitys'
  const roles = hakuData.roles
  const presentingOfficer = _.find(roles,(role)=>role.role=="presenting_officer")
  const {name,email} = presentingOfficer
  return {message:defaultMessage(avustushaku.content.name.fi,selvitysName, name, email)}
}

export default class SelvitysEmail extends Component {

  constructor(props){
    super(props)
    this.state = initState(props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.setState(initState(nextProps))
    }
  }

  render() {
    const {controller,avustushaku,hakemus, selvitysHakemus, selvitysType} = this.props
    const avustushakuId = avustushaku.id
    const message = this.state.message
    const selvitysEmail = selvitysHakemus["selvitys-email"]
    const selvitysEmailSent = selvitysEmail!=null
    const email = _.find(hakemus.answers,(i)=>i.key=='primary-email').value
    const subject = selvitysType=='valiselvitys' ? 'Väliselvitys lähetetty' : 'Loppuselvitys lähetetty'

    const onChange = (event) => {
      this.setState({message: event.target.value})
    }

    const onSendMessage = () =>{
      const request = {
        message:message,
        "selvitys-hakemus-id":selvitysHakemus.id,
        to:email,
        subject:subject
      }
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/avustushaku/${avustushakuId}/selvitys/${selvitysType}/send`,request))
      sendS.onValue((res)=>{
        controller.loadSelvitys()
      })
    }

    return(
      <div>
        {selvitysEmailSent && <div>
          <div className="selvitys-email-header">
            <div>Lähetetty {selvitysEmail.send}</div>
            <div>To: {selvitysEmail.to}</div>
            <div>Subject: {selvitysEmail.subject}</div>
          </div>
          <div className="selvitys-email-send">{selvitysEmail.message}</div>
        </div>}
        {!selvitysEmailSent && <div>
          <div className="selvitys-email-header">
            <div>From: no-reply@oph.fi</div>
            <div>To: <a href={'mailto:' + email}>{email}</a></div>
            <div>Subject: {subject}</div>
          </div>
          <textarea className="textarea-email" value={message} onChange={onChange}/>
          <button onClick={onSendMessage}>Hyväksy ja lähetä viesti</button>
        </div>}
      </div>
    )
  }
}