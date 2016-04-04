import React, { Component } from 'react'
import _ from 'lodash'
import Liitteet from '../data/Liitteet'
import Bacon from 'baconjs'
import HttpUtil from 'va-common/web/HttpUtil.js'

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
      <p>Päätökset lähetetään kaikille hakemusten jättäjille</p>
      {
        this.sentOk() ?
        <div>Päätös lähetetty <strong>{this.state.sent}/{this.state.count}:lle</strong> hakijalle</div>
        :
        this.sendControls()
      }
    </div>
  }

  sentOk() {
    return _.isNumber(this.state.count) && this.state.count == this.state.sent
  }

  fetchEmailState(avustushakuId) {
    const sendS = Bacon.fromPromise(HttpUtil.get(`/api/paatos/sent/${avustushakuId}`,{}))
    sendS.onValue((res)=>{
      this.setState({...this.state, count:res.count, sent:res.sent, mail:res.mail, exampleUrl: res['example-url']})
    })
  }

  sendControls() {
    const onPreview = () => {
      this.setState({preview:true})
    }

    const onSend = () =>{
      this.setState({...this.state,sending:true})
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/paatos/sendall/${this.props.avustushaku.id}`,{}))
      sendS.onValue((res)=>{
          this.setState({count:res.count, sent:res.sent})
        }
      )
    }

    if (!_.isNumber(this.state.count)) return <img src="/img/ajax-loader.gif"/>
    if (this.state.sending) return <div><img src="/img/ajax-loader.gif"/>&nbsp;Lähetetään...</div>
    if (this.state.preview) {
      return <div>
        {this.emailPreview()}
        <button onClick={onSend} className="btn btn-selected">Vahvista päätösten lähettäminen</button>
      </div>
    }
    return <div>
      {this.emailPreview()}
      <button onClick={onPreview} className="btn btn-blue">Aloita {(this.state.count-this.state.sent)}/{this.state.count} päätöksen lähettäminen</button>
    </div>
  }

  emailPreview() {
    const mailContent = () => this.state.mail.content.replace("URL_PLACEHOLDER", `<a href=${this.state.exampleUrl}>Esimerkkipäätös</a>`)

    return <div>
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
      {id:"maksu",title:"Avustuksen maksu"},
      {id:"kaytto",title:"Avustuksen käyttö"},
      {id:"kayttooikeudet",title:"Käyttöoikeudet"},
      {id:"selvitysvelvollisuus",title:"Selvitysvelvollisuus"},
      {id:"kayttoaika",title:"Valtionavustuksen käyttöaika"},
      {id:"lisatiedot",title:"Lisätiedot"}
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