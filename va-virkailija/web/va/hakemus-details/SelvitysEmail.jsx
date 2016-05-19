import React, {Component} from 'react'
import Bacon from 'baconjs'
import HttpUtil from 'va-common/web/HttpUtil.js'

const defaultMessage = (avustushakuName,selvitysName)=>{
  return `Hei,
Hankkeen "${avustushakuName}" ${selvitysName} on nyt käsitelty ja hyväksytty.

Terveisin,
TODO Kimmo Koskinen
TODO 050 923 9432
`
}

const initState = (props) => {
  const selvitysName = props.selvitysType=='valiselvitys' ? 'väliselvitys' : 'loppuselvitys'
  return {message:defaultMessage(props.avustushaku.content.name.fi,selvitysName)}
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
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/avustushaku/${avustushakuId}/selvitys/send`,request))
      sendS.onValue((res)=>{
        controller.loadSelvitys()
      })
    }

    return(
      <div>
        {selvitysEmailSent && <div>
          <div>Lähetetty {selvitysEmail.send}</div>
          <div>To: {selvitysEmail.to}</div>
          <div>Subject: {selvitysEmail.subject}</div>
          <div style={{whiteSpace:'pre-line',marginTop:10}}>{selvitysEmail.message}</div>
        </div>}
        {!selvitysEmailSent && <div>
          <div>From: no-reply@oph.fi</div>
          <div>To: <a href={'mailto:' + email}>{email}</a></div>
          <div>Subject: {subject}</div>
          <textarea className="textarea-email" value={message} onChange={onChange}/>
          <button onClick={onSendMessage}>Hyväksy ja lähetä viesti</button>
        </div>}
      </div>
    )
  }
}