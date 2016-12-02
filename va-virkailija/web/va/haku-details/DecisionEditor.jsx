import React, { Component } from 'react'
import _ from 'lodash'
import Liitteet from 'va-common/web/va/data/Liitteet'
import Bacon from 'baconjs'
import HttpUtil from 'va-common/web/HttpUtil.js'
import DateUtil from 'soresu-form/web/form/DateUtil'
import PaatosUrl from '../hakemus-details/PaatosUrl.js'
import Selvitys from './Selvitys.jsx'
import {RahoitusAlueet,Momentti} from '../data/Rahoitusalueet'

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


class DateField extends React.Component {
  constructor(props){
    super(props)
    const field = props.field
    this.state = {value: this.value(props,field),field:field}
  }

  value(props,field) {
    return _.get(props.avustushaku, `decision.${field}`, "")
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.avustushaku.id!=this.props.avustushaku.id){
      this.setState({
        value: this.value(nextProps,nextProps.field)
      })
    }
  }

  render() {
    const onChange = (event)=>{
      this.setState({value:event.target.value})
      this.props.controller.onChangeListener(this.props.avustushaku, event.target, event.target.value)
    }
    const field = this.state.field
    return (
      <div className="decision-date">
        <div className="decision-column">
          <span className="decision-date-label">{this.props.label}</span>
          <input type="text" value={this.state.value} id={`decision.${field}`} onChange={onChange}/>
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

class RegenerateDecisions extends React.Component {
  constructor(props){
    super(props)
    this.state = {completed:false,confirm:false}
  }

  render(){
    const avustushaku = this.props.avustushaku

    const onConfirm = () =>{
      this.setState({confirm:true})
    }

    const onRegenerate = () =>{
      this.setState({regenerating:true})
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/paatos/regenerate/${avustushaku.id}`,{}))
      sendS.onValue((res)=>{
        this.setState({completed:true})
      })
    }

    const regenerating = this.state.regenerating
    return (
      <div>
        {this.state.completed && <div style={{fontWeight:'bold',marginBottom:10,marginTop:10}}>Päätökset luotu uudelleen</div>
        }
        {!this.state.completed &&
          <div>
            {this.state.confirm && <button onClick={onRegenerate} disabled={regenerating}>{regenerating ? "Vahvistetaan" :  "Vahvista päätösten luominen"}</button>}
            {!this.state.confirm && <button onClick={onConfirm}>Luo päätökset uudelleen</button>}
          </div>
        }

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
        <DateField {...this.props} field="date" label="Ratkaisupäivä"/>
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
      this.setState({...this.state, count:res.count, sent:res.sent, mail:res.mail, sentTime: res['sent-time'], exampleUrl: res['example-url'],paatokset:res.paatokset})
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
          this.setState({...this.state, count:res.count, sent:res.sent, sentTime: res['sent-time'],paatokset:res.paatokset, sending: false})
        }
      )
    }

    if (!_.isNumber(this.state.count)) return <img src="/img/ajax-loader.gif"/>

    const onShowViews = (paatos) =>{
      const sendS = Bacon.fromPromise(HttpUtil.get(`/api/paatos/views/${paatos.id}`,{}))
      sendS.onValue((res)=>{
        const paatosViews = res.views.map((v)=>{
          const dateTime = `${DateUtil.asDateString(v.view_time)} ${DateUtil.asTimeString(v.view_time)}`
          return ({...v,timeFormatted:dateTime})
        })
        this.setState({paatosDetail:paatos.id,paatosViews:paatosViews})
      })
    }

    const onCloseViews = () => this.setState({paatosDetail:undefined})

    return <div className="decision-send-controls">
      {this.emailPreview()}
      <div className="decision-separator"/>
      {this.state.sending && <div><img src="/img/ajax-loader.gif"/>&nbsp;<strong>Päätöksiä lähetetään...</strong></div>}
      {this.mailsToSend() && <span><button disabled={this.state.preview || this.sentOk()} onClick={onPreview}>Lähetä {this.mailsToSendLabel()} päätöstä</button>&nbsp;</span>}
      {!this.mailsToSend() && <RegenerateDecisions avustushaku={this.props.avustushaku}/>}
      {this.state.preview && <button onClick={onSend}>Vahvista lähetys</button>}
      {this.sentOk() &&
        <div>
          <strong>{this.state.sent} päätöstä lähetetty {this.sentTimeStamp()}</strong>
          <table className="table table--sm table--views">
            <colgroup>
              <col width="60%"/>
              <col width="35%"/>
              <col width="5%"/>
            </colgroup>
            <thead>
              <tr>
                <th>Hakemus</th>
                <th>Osoitteet</th>
                <th>Näytöt</th>
              </tr>
            </thead>
            <tbody>
              {this.state.paatokset.map((paatos,index)=>
                <tr key={index}>
                  <td>{paatos.id} {paatos["organization-name"]} - <a target="_blank" href={PaatosUrl.publicLink(this.props.avustushaku.id,paatos.user_key)}>{paatos["project-name"]}</a></td>
                  <td>{paatos["sent-emails"].addresses.join(" ")}</td>
                  <td style={{position:'relative'}}>
                    {paatos.view_count==0 && <span>{paatos.view_count}</span>}
                    {paatos.view_count>0 && <a onClick={onShowViews.bind(this, paatos)}>{paatos.view_count}</a>}
                    {this.state.paatosDetail==paatos.id &&
                      <div className="panel person-panel person-panel--sm person-panel--view-details">
                        <button className="close" onClick={onCloseViews}>x</button>
                        <table classNam="table">
                          <colgroup>
                            <col width="20%"/>
                            <col width="20%"/>
                            <col width="60%"/>
                          </colgroup>
                          <tbody>
                            {this.state.paatosViews.map((view,index)=>
                              <tr key={index}>
                                <td>{view.timeFormatted}</td>
                                <td>{view.remote_addr}</td>
                                <td>{view.headers["user-agent"]}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    }
                  </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      }
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
      {id:"sovelletutsaannokset",title:"Sovelletut säännökset"},
      {id:"kayttooikeudet",title:"Tekijänoikeudet"},
      {id:"kayttoaika",title:"Avustuksen käyttöaika"},
      {id:"selvitysvelvollisuus",title:"Selvitysvelvollisuus"},
      {id:"hyvaksyminen",title:"Päätöksen hyväksyminen"},
      {id:"johtaja",title:"Johtaja"},
      {id:"esittelija",title:"Valmistelija"}
    ]
    const multipleRahoitusalue = avustushaku["multiple-rahoitusalue"]
    return (
      <div className="decision-editor">
        <DecisionFields key="taustaa" title="Taustaa" avustushaku={avustushaku} id="taustaa" onChange={onChange}/>
        <DecisionFields key="myonteinenlisateksti" title="Myönteisen päätöksen lisäteksti" avustushaku={avustushaku} id="myonteinenlisateksti" onChange={onChange}/>
        {multipleRahoitusalue  &&
        <div className="decision-subfields">
            {Momentti.map((field)=><DecisionFields key={field} title={"Myönteisen päätöksen lisäteksti - " + field} avustushaku={avustushaku} id={"myonteinenlisateksti-" + field} onChange={onChange}/>)}
          </div>
        }
        {fields.map((field)=><DecisionFields key={field.id} title={field.title} avustushaku={avustushaku} id={field.id} onChange={onChange}/>)}
        <DecisionFields key="maksu" title="Avustuksen maksuaika" avustushaku={avustushaku} id="maksu" onChange={onChange}/>
        <Selvitys {...this.props}/>
        {avustushaku.content.multiplemaksuera===true && <DateField avustushaku={avustushaku} controller={controller} field="maksudate" label="Viimeinen maksuerä"/>}
        <LiitteetList avustushaku={avustushaku} controller={controller}/>
        <DecisionDateAndSend avustushaku={avustushaku} controller={controller}/>
      </div>
    )
  }
}
