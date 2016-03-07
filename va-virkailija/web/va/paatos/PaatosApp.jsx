import PolyfillBind from '../../../../va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import HakemusArviointiStatuses from './../hakemus-details/HakemusArviointiStatuses.js'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'
import PaatosController from './PaatosController.jsx'
import style from './paatos.less'

const parsedRoute = new RouteParser('/paatos/avustushaku/:avustushaku_id/hakemus/:hakemus_id').match(location.pathname)
const controller = new PaatosController()

controller.initializeState(parsedRoute).onValue((state) => {
  try {
    if (state.paatosData) {
      ReactDOM.render(<PaatosApp state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.paatosData not yet loaded.')
    }
  } catch (e) {
    console.log('Error from ReactDOM.render with state', state, e)
  }
})

const Section = ({title,content,children})=>
  <section className="section">
    <h2>{title}</h2>
    <div className="content">
      {children || content}
    </div>
  </section>

const DecisionContent = ({id,avustushaku}) =>{
  const language = "fi"
  const content = _.get(avustushaku, `decision.${id}.${language}`,"")
  if(_.isEmpty(content)) return <div></div>
  const paragraphs = content.split("\n")
  return (
    <div>
      {paragraphs.map((p)=><p key={p}>{p}</p>)}
    </div>
  )
}

const OptionalSection = ({title,id,avustushaku}) =>{
  const language = "fi"
  const content = _.get(avustushaku, `decision.${id}.${language}`,"")
  if(_.isEmpty(content)) return <div></div>
  const paragraphs = content.split("\n")
  return (
    <Section title={title}>
      {paragraphs.map((p)=><p key={p}>{p}</p>)}
    </Section>
  )
}

export default class PaatosApp extends Component {
  render() {
    const {hakemus, avustushaku, roles} = this.props.state.paatosData
    const decisionStatus = hakemus.arvio.status
    const selectedRoleId = hakemus.arvio['presenter-role-id']
    const role = selectedRoleId ? roles.find(role => role.id === selectedRoleId) : roles[0]

    return (
        <section>
          <header>
            <div><img src="/img/logo.png" width="200"/></div>
            <div>Päätös</div>
            <div>{hakemus['register-number']}</div>
          </header>
          <div>
            <Section title="Asia">
              VALTIONAVUSTUKSEN MYÖNTÄMINEN<br/>
              {avustushaku.content.name.fi}
            </Section>
            <OptionalSection title="Taustaa" id="taustaa" avustushaku={avustushaku}/>
            {decisionStatus == 'rejected' ? <RejectedDecision avustushaku={avustushaku} hakemus={hakemus} role={role}/> :
                <AcceptedDecision hakemus={hakemus} avustushaku={avustushaku} role={role}/>}
          </div>
        </section>
    )
  }
}

const Perustelut = ({hakemus}) => <Section title="Päätöksen perustelut" content={hakemus.arvio.perustelut}/>

const Lisatietoja = ({avustushaku,role})=>
  <Section title="Lisätietoja">
    <p>Lisätietoja antaa: {role.name} &lt;{role.email}&gt;</p>
    <DecisionContent avustushaku={avustushaku} id="lisatiedot"/>
  </Section>

const Liitteet = ()=>
  <Section title="LIITTEET">
    <Todo>liitteet, hakukohtainen</Todo>
  </Section>

const Kayttosuunnitelma = ({avustushaku,hakemus})=>
  <div>
    <h1>Käyttösuunnitelma</h1>
    <section className="section">
      <p><strong>{avustushaku.content.name.fi}</strong></p>
      <p>Hanke: {hakemus['project-name']}</p>
      <p>Opetushallitus on hyväksynyt hankkeen rahoituksen oheisen käyttösuunnitelman mukaisesti.</p>
      <p>{hakemus.arvio.perustelut}</p>
      <p><Todo>taulukko</Todo></p>
    </section>
  </div>

const AcceptedDecision = ({hakemus, avustushaku, role}) => {
  const answers = hakemus.answers
  const iban = InputValueStorage.readValues(answers, 'iban')[0].value
  const bic = InputValueStorage.readValues(answers, 'bic')[0].value
  return (
      <section>
        <Section title="Päätös">
            <p>Opetushallitus on päättänyt myöntää valtionavustusta seuraavasti:</p>
            <p>Hakija: {hakemus['organization-name']}<br/>
              Hanke: {hakemus['project-name']}</p>
            <p>Opetushallitus hyväksyy avustuksen saajan valtionavustukseen oikeuttavina menoina xx euroa.
              Valtionavustuksena tästä myönnetään {(100 - avustushaku.content['self-financing-percentage'])} %
              eli {hakemus.arvio['budget-granted']} euroa</p>
        </Section>
        <Perustelut hakemus={hakemus}/>
        <Section title="Avustuksen maksu">
          <p>Avustus maksetaan hakijan ilmoittamalle pankkitilille: <strong>{iban}, {bic}</strong></p>
          <DecisionContent avustushaku={avustushaku} id="maksu"/>
        </Section>
        <OptionalSection title="Avustuksen käyttö" id="kaytto" avustushaku={avustushaku}/>
        <OptionalSection title="Käyttöoikeudet" id="kayttooikeudet" avustushaku={avustushaku}/>
        <OptionalSection title="Selvitysvelvollisuus" id="selvitysvelvollisuus" avustushaku={avustushaku}/>
        <OptionalSection title="Valtionavustuksen käyttöaika" id="kayttoaika" avustushaku={avustushaku}/>
        <Lisatietoja avustushaku={avustushaku} role={role}/>
        <Liitteet/>
        <Kayttosuunnitelma avustushaku={avustushaku} hakemus={hakemus}/>
      </section>
  )
}

const RejectedDecision = ({avustushaku, hakemus, role}) =>
    <section>
      <Section title="Päätös">
        <p>Opetushallitus on päättänyt olla myöntämättä valtionavustusta seuraavasti:</p>
        <p>Hakija: {hakemus['organization-name']}<br/>
          Hanke: {hakemus['project-name']}</p>
      </Section>
      <Perustelut hakemus={hakemus}/>
      <Lisatietoja avustushaku={avustushaku} role={role}/>
      <Liitteet/>
    </section>

const Todo = ({children}) => <span className="todo">[TODO: {children}]</span>