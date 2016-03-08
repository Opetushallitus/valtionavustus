import PolyfillBind from '../../../../va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import HakemusArviointiStatuses from './../hakemus-details/HakemusArviointiStatuses.js'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
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

export default class PaatosApp extends Component {
  render() {
    const {hakemus, avustushaku, roles, form} = this.props.state.paatosData
    const decisionStatus = hakemus.arvio.status
    const selectedRoleId = hakemus.arvio['presenter-role-id']
    const role = selectedRoleId ? roles.find(role => role.id === selectedRoleId) : roles[0]
    const formContent = form.content
    return (
        <section>
          <header>
            <section>
              <div><img src="/img/logo.png" width="200"/></div>
              <div>Päätös</div>
              <div>{hakemus['register-number']}</div>
            </section>
          </header>
          <Section title="Asia">
            VALTIONAVUSTUKSEN MYÖNTÄMINEN<br/>
            {avustushaku.content.name.fi}
          </Section>
          <OptionalSection title="Taustaa" id="taustaa" avustushaku={avustushaku}/>
          {decisionStatus == 'rejected' ? <RejectedDecision avustushaku={avustushaku} hakemus={hakemus} role={role}/> :
              <AcceptedDecision hakemus={hakemus} avustushaku={avustushaku} role={role} formContent={formContent}/>}
        </section>
    )
  }
}

const AcceptedDecision = ({hakemus, avustushaku, role, formContent}) => {
  const answers = hakemus.answers
  const iban = InputValueStorage.readValues(answers, 'iban')[0].value
  const bic = InputValueStorage.readValues(answers, 'bic')[0].value
  const budgetItems = FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
      .filter(budgetItem => budgetItem.params.incrementsTotal)
      .map(budgetItem => _.extend(budgetItem, {
        original: findCost(formContent, hakemus.answers, budgetItem),
        overridden: findCost(formContent, hakemus.arvio['overridden-answers'], budgetItem)
      }))
  const totalOriginalCosts = formatNumber(_.sum(budgetItems.map(i=>Number(i.original))))
  const totalCosts = formatNumber(_.sum(budgetItems.map(i=>Number(i.overridden))))
  return (
      <section>
        <Section title="Päätös">
          <p>Opetushallitus on päättänyt myöntää valtionavustusta seuraavasti:</p>
          <p>Hakija: {hakemus['organization-name']}<br/>
            Hanke: {hakemus['project-name']}</p>
          <p>Opetushallitus hyväksyy avustuksen saajan valtionavustukseen oikeuttavina menoina {totalCosts}&nbsp;.
            Valtionavustuksena tästä myönnetään {(100 - avustushaku.content['self-financing-percentage'])} %
            eli {formatNumber(hakemus.arvio['budget-granted'])}</p>
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
        <Kayttosuunnitelma budgetItems={budgetItems} avustushaku={avustushaku} hakemus={hakemus} totalCosts={totalCosts} totalOriginalCosts={totalOriginalCosts}/>
      </section>
  )
}

const Kayttosuunnitelma = ({budgetItems, avustushaku, hakemus, totalCosts, totalOriginalCosts}) =>
    <div>
      <div className="sectionWrapper">
        <section className="section">
          <h1>Käyttösuunnitelma</h1>

          <p><strong>{avustushaku.content.name.fi}</strong></p>
          <p>Hanke: {hakemus['project-name']}</p>
          <p>Opetushallitus on hyväksynyt hankkeen rahoituksen oheisen käyttösuunnitelman mukaisesti.</p>
          <p>{hakemus.arvio.perustelut}</p>

          <table>
            <thead>
            <tr>
              <th>Menot</th>
              <th className="amount">Haettu</th>
              <th className="amount">Hyväksytty</th>
            </tr>
            </thead>
            <tbody>
            {budgetItems.map(budgetItem=><BudgetItemRow key={budgetItem.id} item={budgetItem}/>)}
            </tbody>
            <tfoot>
            <tr>
              <th>Yhteensä</th>
              <th className="amount">{totalOriginalCosts}</th>
              <th className="amount">{totalCosts}</th>
            </tr>
            </tfoot>
          </table>
        </section>
      </div>
    </div>

const BudgetItemRow = ({item}) =>
    <tr>
      <td>{item.label.fi}</td>
      <td className="amount">{formatNumber(item.original)}</td>
      <td className="amount">{formatNumber(item.overridden)}</td>
    </tr>

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

const Section = ({title,content,children})=>
    <div className="sectionWrapper" hidden={!content && !children}>
      <section className="section">
        <h2>{title}</h2>
        <div className="content">
          {children || content}
        </div>
      </section>
    </div>


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

const Perustelut = ({hakemus}) => <Section title="Päätöksen perustelut" content={hakemus.arvio.perustelut}/>

const Lisatietoja = ({avustushaku,role})=>
  <Section title="Lisätietoja">
    <p>Lisätietoja antaa: {role.name} &lt;{role.email}&gt;</p>
    <DecisionContent avustushaku={avustushaku} id="lisatiedot"/>
  </Section>

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

const Liitteet = () =>
  <Section title="LIITTEET">
    <Todo>liitteet, hakukohtainen</Todo>
  </Section>

const findCost = (formContent, answers, budgetItem) => Number(InputValueStorage.readValue(formContent, answers, budgetItem.children[1].id))

const Todo = ({children}) => <span className="todo">[TODO: {children}]</span>

const formatNumber = num => num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1\u00A0") + '\u00A0€'
