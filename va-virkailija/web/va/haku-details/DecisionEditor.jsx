import React, { Component } from 'react'
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
      <div className="decision-row">
        <div className="decision-column">
          <label>Päätöksen päivämäärä</label>
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

class SendDecisions extends React.Component {
  constructor(props){
    super(props)
    this.state = {preview:false}
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.avustushaku.id!=this.props.avustushaku.id){
      this.setState({preview:false,count:undefined,sending:false})
    }
  }

  render(){
    const avustushaku = this.props.avustushaku

    const onPreview = () =>{
      this.setState({preview:true})
    }

    const onSend = () =>{
      this.setState({...this.state,sending:true})
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/paatos/sendall/${avustushaku.id}`,{}))
      sendS.onValue((res)=>{
        this.setState({count:res.count})
        }
      )
    }
    if(avustushaku.status!="resolved"){
      return null;
    }
    return (
      <div className="send-decisions-panel">
        <h3>Päätösten lähettäminen</h3>
        <p>Päätökset lähetetään kaikille hakemusten jättäjille</p>
        <div hidden={!this.state.count}>Päätös lähetetty <strong>{this.state.count}:lle</strong> hakijalle</div>
        <div hidden={this.state.count}>
          <button hidden={!this.state.preview} onClick={onSend} className="btn btn-selected" disabled={this.state.sending}>Vahvista päätösten lähettäminen</button>
          <button hidden={this.state.preview} onClick={onPreview} className="btn btn-blue">Aloita päätösten lähettäminen</button>
        </div>
      </div>
    )
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
        <SendDecisions avustushaku={this.props.avustushaku}/>
        <DecisionDate {...this.props}/>
        {fields.map((field)=><DecisionFields key={field.id} title={field.title} avustushaku={avustushaku} id={field.id} onChange={onChange}/>)}
        <LiitteetList avustushaku={avustushaku} controller={controller}/>
      </div>
    )
  }
}