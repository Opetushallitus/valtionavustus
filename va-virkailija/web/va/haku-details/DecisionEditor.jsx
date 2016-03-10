import React, { Component } from 'react'

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

export default class DecisionEditor extends React.Component {
  render() {
    const {avustushaku,controller} = this.props
    const onChange = (e) =>controller.onChangeListener(avustushaku, e.target, e.target.value)
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
        <DecisionDate {...this.props}/>
        {fields.map((field)=><DecisionFields key={field.id} title={field.title} avustushaku={avustushaku} id={field.id} onChange={onChange}/>)}
      </div>
    )
  }
}