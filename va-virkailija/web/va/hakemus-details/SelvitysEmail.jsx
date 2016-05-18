import React, {Component} from 'react'
import Bacon from 'baconjs'
import HttpUtil from 'va-common/web/HttpUtil.js'

const defaultMessage = (avustushakuName)=>{
  return `Hei,
Hankkeen "${avustushakuName}" väliselvitys on nyt käsitelty ja hyväksytty.

Terveisin,
Kimmo Koskinen
050 923 9432
`
}

export default class SelvitysEmail extends Component {

  constructor(props){
    super(props)
    this.state = {message:defaultMessage(props.avustushaku.content.name.fi)}
  }

  render() {
    const { avustushaku, selvitysHakemus} = this.props
    const avustushakuId = avustushaku.id
    const message = this.state.message
    const onChange = (event) => {
      this.setState({message: event.target.value})
    }

    const onSendMessage = () =>{
      console.log(this.state.message)
      const request = {
        message:message,
        selvitysHakemusId:selvitysHakemus.id
      }
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/avustushaku/${avustushakuId}/selvitys/send`,request))
      sendS.onValue((res)=>{
        console.log(res)
      })

    }

    return(
      <div>
        <div>From:</div>
        <div>To: </div>
        <div>Subject: Väliselvitys hyväksytty</div>
        <textarea className="textarea-email" value={message} onChange={onChange}/>
        <button onClick={onSendMessage}>Hyväksy ja lähetä viesti</button>
      </div>
    )
  }
}