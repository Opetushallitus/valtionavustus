import React, {Component} from 'react'
import Bacon from 'baconjs'

import HttpUtil from 'soresu-form/web/HttpUtil'
import NameFormatter from 'va-common/web/va/util/NameFormatter'

const defaultMessage = (avustushakuName, selvitysName, name, email)=>{
  return `Hei,
Hankkeen '${avustushakuName}' ${selvitysName} on nyt käsitelty ja hyväksytty.

Terveisin,
${name}
${email}
`
}

const defaultSubject = (selvitysType) => {
  return selvitysType=='valiselvitys' ? 'Väliselvitys käsitelty' : 'Loppuselvitys käsitelty'
}

const initState = ({selvitysType, avustushaku, userInfo}) => {
  const selvitysName = selvitysType=='valiselvitys' ? 'väliselvitys' : 'loppuselvitys'
  const name = NameFormatter.onlyFirstForename(userInfo["first-name"]) + " " + userInfo["surname"]
  const email = userInfo.email
  return {message:defaultMessage(avustushaku.content.name.fi,selvitysName, name, email), subject: defaultSubject(selvitysType)}
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
    const subject = this.state.subject
    const message = this.state.message
    const selvitysEmail = selvitysHakemus["selvitys-email"]
    const selvitysEmailSent = selvitysEmail!=null
    const email = _.find(hakemus.answers,(i)=>i.key=='primary-email').value
    const title = selvitysType=='valiselvitys' ? 'Väliselvityksen hyväksyntä' : 'Loppuselvityksen hyväksyntä'
    const titleWithLanguage = selvitysHakemus.language=="sv" ? `${title} ruotsiksi` : title

    const onMessageChange = (event) => {
      this.setState({message: event.target.value})
    }

    const onSubjectChange = (event) => {
      this.setState({subject: event.target.value})
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
        controller.refreshHakemukset(avustushakuId)
      })
    }

    return(
      <div>
        {selvitysEmailSent && <div>
          <h2>{title}</h2>
          <div className="selvitys-email-header">
            <div>Lähetetty {selvitysEmail.send}</div>
            <div>To: {selvitysEmail.to}</div>
            <div>Subject: {selvitysEmail.subject}</div>
          </div>
          <div className="selvitys-email-send">{selvitysEmail.message}</div>
        </div>}
        {!selvitysEmailSent && <div>
          <h2>{titleWithLanguage}</h2>
          <div className="selvitys-email-header">
            <div>From: no-reply@oph.fi</div>
            <div>To: <a href={'mailto:' + email}>{email}</a></div>
            <div>Subject: <input size="40" type="text" value={subject} onChange={onSubjectChange}/></div>
          </div>
          <textarea className="textarea-email" value={message} onChange={onMessageChange}/>
          <button onClick={onSendMessage}>Hyväksy ja lähetä viesti</button>
        </div>}
      </div>
    )
  }
}
