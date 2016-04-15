import React, { Component } from 'react'
import _ from 'lodash'
import Liitteet from '../data/Liitteet'
import Bacon from 'baconjs'
import HttpUtil from 'va-common/web/HttpUtil.js'
import DateUtil from 'soresu-form/web/form/DateUtil'

const DecisionField = ({avustushaku, title, id,language, onChange}) => {
  const fieldId= `decision.${id}.${language}`
  const value = _.get(avustushaku, fieldId, "")
  const titleLanguage = language=="sv" ? `${title} ruotsiksi` : title
  return(
    <div className="decision-column">
      <label>{titleLanguage}</label>
      <textarea onChange={onChange} rows="5" id={fieldId} value={value}></textarea>
    </div>
  )
}

const DecisionFields = ({title,avustushaku,id,onChange}) =>
  <div className="decision-row">
    {['fi','sv'].map((language)=><DecisionField key={language} title={title} avustushaku={avustushaku} id={id} language={language} onChange={onChange}></DecisionField>)}
  </div>

class DecisionDate extends React.Component {
  constructor(props){
    super(props)
    this.state = {value: this.value(props)}
  }

  value(props) {
    return _.get(props.avustushaku, "decision.date", "")
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.avustushaku.id!=this.props.avustushaku.id){
      this.setState({
        value: this.value(nextProps)
      })
    }
  }

  render() {
    const onChange = (event)=>{
      this.setState({value:event.target.value})
      this.props.controller.onChangeListener(this.props.avustushaku, event.target, event.target.value)
    }

    return (
      <div className="decision-date">
        <div className="decision-column">
          <span className="decision-date-label">Ratkaisupäivä</span>
          <input type="text" value={this.state.value} id="decision.date" onChange={onChange}/>
        </div>
      </div>
    )
  }
}

class LiitteetList extends React.Component{
  render(){
    const avustushaku = this.props.avustushaku
    const controller = this.props.controller
    const liitteet = _.get(avustushaku,"decision.liitteet",[])
    const Liite = (group,liite) =>{
      const liiteChanged = (event) => {
        const newValue = {
          group:group,
          id:event.target.value
        }
        const newLiitteet = _.reject(liitteet,(l)=>l.group==newValue.group).concat([newValue])
        controller.onChangeListener(avustushaku, {id:"decision.liitteet"}, newLiitteet)
      }
      const checked= _.any(liitteet,(currentLiite) => currentLiite.group==group && currentLiite.id==liite.id)
      const link = `/public/api/liite/${liite.id}`
      return(
        <div key={liite.id}>
          <label>
            <input type="radio" name={group} onChange={liiteChanged} value={liite.id} checked={checked}/> {liite.fi} - {liite.id} <a href={`${link}/fi`} target="_blank">fi</a> <a href={`${link}/sv`} target="_blank">sv</a>
          </label>
        </div>
        )
      }
    return(
      <div>
        <h4>Päätöksen liitteet</h4>
        <div className="liite-row">
          {Liitteet.map((group)=>{return (
            <div key={group.group}>
              <h5>{group.group}</h5>
              {group.attachments.map(_.partial(Liite,group.group))}
            </div>
            )
            }
          )}
        </div>

      </div>
    )
  }
}

class DecisionDateAndSend extends React.Component {
  constructor(props){
    super(props)
    this.state = {preview:false}
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.avustushaku.id!=this.props.avustushaku.id) {
      this.setState({preview:false,count:undefined,sending:false})
      this.fetchEmailState(nextProps.avustushaku.id)
    }
  }

  componentDidMount() {
    this.fetchEmailState(this.props.avustushaku.id)
  }

  render(){
    return (
      <div className="send-decisions-panel">
        <div className="decision-separator"/>
        <DecisionDate {...this.props}/>
        {this.props.avustushaku.status === "resolved" && this.sendEmailSection()}
      </div>
    )
  }

  sendEmailSection() {
    return <div>
      <span className="decision-row">Päätösten lähettäminen sähköpostilla</span>
      <div className="decision-separator"/>
      {this.sendControls()}
    </div>
  }

  sentOk() { return _.isNumber(this.state.count) && this.state.count == this.state.sent }

  mailsToSend() { return !this.sentOk() && !this.state.sending }

  mailsToSendLabel() {
    if (this.sentOk()) return '0'
    //If, for some reason not all of the mails have been sent
    if (this.state.sent !== 0 && this.state.count > 0) return `${(this.state.count-this.state.sent)}/${this.state.count}`
    return this.state.count + ''
  }

  fetchEmailState(avustushakuId) {
    const sendS = Bacon.fromPromise(HttpUtil.get(`/api/paatos/sent/${avustushakuId}`,{}))
    sendS.onValue((res)=>{
      this.setState({...this.state, count:res.count, sent:res.sent, mail:res.mail, sentTime: res['sent-time'], exampleUrl: res['example-url']})
    })
  }

  sendControls() {
    const onPreview = () => {
      this.setState({...this.state, preview:true})
      setTimeout(() => {this.setState({...this.state, preview: false})}, 5000)
    }

    const onSend = () =>{
      this.setState({...this.state,sending: true, preview: false})
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/paatos/sendall/${this.props.avustushaku.id}`,{}))
      sendS.onValue((res)=>{
          this.setState({...this.state, count:res.count, sent:res.sent, sentTime: res['sent-time'], sending: false})
        }
      )
    }

    if (!_.isNumber(this.state.count)) return <img src="/img/ajax-loader.gif"/>
    return <div className="decision-send-controls">
      {this.emailPreview()}
      <div className="decision-separator"/>
      {this.state.sending && <div><img src="/img/ajax-loader.gif"/>&nbsp;<strong>Päätöksiä lähetetään...</strong></div>}
      {this.mailsToSend() && <span><button disabled={this.state.preview || this.sentOk()} onClick={onPreview}>Lähetä {this.mailsToSendLabel()} päätöstä</button>&nbsp;</span>}
      {this.state.preview && <button onClick={onSend}>Vahvista lähetys</button>}
      {this.sentOk() && <div><strong>{this.state.sent} päätöstä lähetetty {this.sentTimeStamp()}</strong></div>}
    </div>
  }

  sentTimeStamp() {
    if (this.state.sentTime) {
      const sentTimeStamp = new Date(this.state.sentTime)
      return `${DateUtil.asDateString(sentTimeStamp)} klo ${DateUtil.asTimeString(sentTimeStamp)}`
    }
    return ''
  }

  emailPreview() {
    const mailContent = () => this.state.mail.content.replace("URL_PLACEHOLDER", `<a href=${this.state.exampleUrl}>${this.state.exampleUrl}</a>`)

    return <div className="decision-email-preview">
      <div className="decision-email-row">
        <strong className="decision-email-field-label">Vastaanottajat:</strong>
        <div className="decision-email-field-value">{this.state.count} hakemuksen yhteyshenkilö, organisaation virallinen sähköpostiosoite ja nimenkirjoitusoikeudelliset henkilöt</div>
      </div>
      <div className="decision-email-row">
        <strong className="decision-email-field-label">Lähettäjä:</strong>
        <div className="decision-email-field-value">{this.state.mail.sender}</div>
      </div>
      <div className="decision-email-row">
        <strong className="decision-email-field-label">Aihe:</strong>
        <div className="decision-email-field-value">{this.state.mail.subject}</div>
      </div>
      <div className="decision-email-row">
        <strong className="decision-email-field-label">Viesti:</strong>
        <div className="decision-email-field-value decision-email-content" dangerouslySetInnerHTML={{__html: mailContent()}}></div>
      </div>
    </div>
  }
}

export default class DecisionEditor extends React.Component {
  render() {
    const {avustushaku,controller} = this.props
    const onChange = (e) => controller.onChangeListener(avustushaku, e.target, e.target.value)
    const fields = [
      {id:"taustaa",title:"Taustaa"},
      {id:"myonteinenlisateksti",title:"Myönteisen päätöksen lisäteksti"},
      {id:"sovelletutsaannokset",title:"Sovelletut säännökset"},
      {id:"maksu",title:"Avustuksen maksu"},
      {id:"kaytto",title:"Avustuksen käyttö"},
      {id:"kayttooikeudet",title:"Käyttöoikeudet"},
      {id:"selvitysvelvollisuus",title:"Selvitysvelvollisuus"},
      {id:"kayttoaika",title:"Valtionavustuksen käyttöaika"},
      {id:"hyvaksyminen",title:"Päätöksen hyväksyminen"},
      {id:"lisatiedot",title:"Lisätiedot"},
      {id:"johtaja",title:"Johtaja"},
      {id:"esittelija",title:"Esittelijä"}
    ]
    return (
      <div className="decision-editor">
        {fields.map((field)=><DecisionFields key={field.id} title={field.title} avustushaku={avustushaku} id={field.id} onChange={onChange}/>)}
        <LiitteetList avustushaku={avustushaku} controller={controller}/>
        <DecisionDateAndSend avustushaku={avustushaku} controller={controller}/>
      </div>
    )
  }
}