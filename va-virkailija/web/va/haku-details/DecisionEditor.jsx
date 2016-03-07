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
        {fields.map((field)=><DecisionFields key={field.id} title={field.title} avustushaku={avustushaku} id={field.id} onChange={onChange}/>)}
      </div>
    )
  }
}