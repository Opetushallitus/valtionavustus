import PolyfillBind from '../../../../va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import HakemusArviointiStatuses from './../hakemus-details/HakemusArviointiStatuses.js'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import PaatosController from './PaatosController.jsx'
import style from './paatos.less'
import queryString from 'query-string'


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
    const translations = this.props.state.translations.paatos
    const languageAnswer = _.find(hakemus.answers,(a)=>a.key=="language")
    const query = queryString.parse(location.search)
    const lang = query.lang ? query.lang : languageAnswer ? languageAnswer.value : "fi"
    return (
        <section>
          <header>
            <div className="logo"><img src="/img/logo.png" width="200"/></div>
            <div className="title"><LocalizedString translationKey="paatos" translations={translations} lang={lang} /> {avustushaku.decision.date}</div>
            <div className="registerNumber">{hakemus['register-number']}</div>
          </header>
          <Section title="asia" lang={lang} translations={translations}>
            <LocalizedString translationKey="asia-title" translations={translations} lang={lang}/>
            <br/>
            {avustushaku.content.name[lang]}
          </Section>
          <OptionalSection title="taustaa" id="taustaa" avustushaku={avustushaku} lang={lang} translations={translations}/>
          {decisionStatus == 'rejected' ? <RejectedDecision avustushaku={avustushaku} hakemus={hakemus} role={role} lang={lang} translations={translations}/> :
              <AcceptedDecision hakemus={hakemus} avustushaku={avustushaku} role={role} formContent={formContent} lang={lang} translations={translations}/>}
        </section>
    )
  }
}

const AcceptedDecision = ({hakemus, avustushaku, role, formContent, lang, translations}) => {
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
  const totalGranted = formatNumber(hakemus.arvio['budget-granted'])
  return (
      <section>
        <Section title="paatos" lang={lang} translations={translations}>
          <p><LocalizedString translationKey="myonnetty-title" translations={translations} lang={lang}/>:</p>
          <p><LocalizedString translationKey="hakija" translations={translations} lang={lang}/>: {hakemus['organization-name']}<br/>
            <LocalizedString translationKey="hanke" translations={translations} lang={lang}/>: {hakemus['project-name']}
          </p>
          <p><LocalizedString translationKey="paatos-myonnetty-1" translations={translations} lang={lang}/> {totalCosts}&nbsp;.
            <LocalizedString translationKey="paatos-myonnetty-2" translations={translations} lang={lang}/> {(100 - avustushaku.content['self-financing-percentage'])} % eli {totalGranted}
          </p>
        </Section>
        <Perustelut hakemus={hakemus} lang={lang} translations={translations}/>
        <Section title="avustuksen-maksu" lang={lang} translations={translations}>
          <p><LocalizedString translationKey="avustus-maksetaan" translations={translations} lang={lang}/>: <strong>{iban}, {bic}</strong></p>
          <DecisionContent avustushaku={avustushaku} id="maksu"/>
        </Section>
        <OptionalSection title="avustuksen-kaytto" id="kaytto" avustushaku={avustushaku} lang={lang} translations={translations}/>
        <OptionalSection title="kayttooikeudet" id="kayttooikeudet" avustushaku={avustushaku} lang={lang} translations={translations}/>
        <OptionalSection title="selvitysvelvollisuus" id="selvitysvelvollisuus" avustushaku={avustushaku} lang={lang} translations={translations}/>
        <OptionalSection title="valtionavustuksen-kayttoaika" id="kayttoaika" avustushaku={avustushaku} lang={lang} translations={translations}/>
        <Lisatietoja avustushaku={avustushaku} role={role} lang={lang} translations={translations}/>
        <Liitteet lang={lang} translations={translations}/>
        <Kayttosuunnitelma
            budgetItems={budgetItems}
            avustushaku={avustushaku}
            hakemus={hakemus}
            totalCosts={totalCosts}
            totalOriginalCosts={totalOriginalCosts}
            totalGranted={totalGranted}
            lang={lang}
            translations={translations}
        />
      </section>
  )
}

const Kayttosuunnitelma = ({budgetItems, avustushaku, hakemus, totalCosts, totalOriginalCosts, totalGranted, lang, translations}) =>
    <div>
      <section className="section">
        <h1><LocalizedString translationKey="kayttosuunnitelma" translations={translations} lang={lang}/></h1>

        <p><strong>{avustushaku.content.name[lang]}</strong></p>
        <p><LocalizedString translationKey="hanke" translations={translations} lang={lang}/> {hakemus['project-name']}</p>
        <p><LocalizedString translationKey="myonnetty-title" translations={translations} lang={lang}/></p>
        <p>{hakemus.arvio.perustelut}</p>

        <table>
          <thead>
          <tr>
            <th><LocalizedString translationKey="menot" translations={translations} lang={lang}/></th>
            <th className="amount"><LocalizedString translationKey="haettu" translations={translations} lang={lang}/></th>
            <th className="amount"><LocalizedString translationKey="hyvaksytty" translations={translations} lang={lang}/></th>
          </tr>
          </thead>
          <tbody>
          {budgetItems.map(budgetItem=><BudgetItemRow key={budgetItem.id} item={budgetItem} lang={lang}/>)}
          </tbody>
          <tfoot>
          <tr>
            <th><LocalizedString translationKey="yhteensa" translations={translations} lang={lang}/></th>
            <th className="amount">{totalOriginalCosts}</th>
            <th className="amount">{totalCosts}</th>
          </tr>
          <tr>
            <th colSpan="2"><LocalizedString translationKey="myonnetty-avustus" translations={translations} lang={lang}/></th>
            <th className="amount">{totalGranted}</th>
          </tr>
          </tfoot>
        </table>
      </section>
    </div>

const BudgetItemRow = ({item,lang}) =>
    <tr>
      <td>{item.label[lang]}</td>
      <td className="amount">{formatNumber(item.original)}</td>
      <td className="amount">{formatNumber(item.overridden)}</td>
    </tr>

const RejectedDecision = ({avustushaku, hakemus, role, lang, translations}) =>
    <section>
      <Section title="paatos" lang={lang} translations={translations}>
        <p><LocalizedString translationKey="hylatty-title" translations={translations} lang={lang}/></p>
        <p><LocalizedString translationKey="hakija" translations={translations} lang={lang}/>: {hakemus['organization-name']}<br/>
          <LocalizedString translationKey="hanke" translations={translations} lang={lang}/>: {hakemus['project-name']}</p>
      </Section>
      <Perustelut hakemus={hakemus} lang={lang} translations={translations}/>
      <Lisatietoja avustushaku={avustushaku} role={role} lang={lang} translations={translations}/>
      <Liitteet lang={lang} translations={translations}/>
    </section>

const Section = ({title, content, lang, translations, children})=>{
  return(
    <section className="section" hidden={!content && !children}>
      <h2><LocalizedString translationKey={title} translations={translations} lang={lang} /></h2>
      <div className="content">
        {children || content}
      </div>
    </section>
  )
}

const OptionalSection = ({title,id, avustushaku, lang, translations}) =>{
  const content = _.get(avustushaku, `decision.${id}.${lang}`,"")
  if(_.isEmpty(content)) return <div></div>
  const paragraphs = content.split("\n")
  return (
      <Section title={title} lang={lang} translations={translations}>
        {paragraphs.map((p)=><p key={p}>{p}</p>)}
      </Section>
  )
}

const Perustelut = ({hakemus, lang, translations}) => <Section title="paatoksen-perustelut" lang={lang} translations={translations} content={hakemus.arvio.perustelut}/>

const Lisatietoja = ({avustushaku, role, lang, translations})=>
  <Section title="lisatietoja" lang={lang} translations={translations}>
    <p><LocalizedString translationKey="lisatietoja-antaa" translations={translations} lang={lang} />: {role.name} &lt;{role.email}&gt;</p>
    <DecisionContent avustushaku={avustushaku} id="lisatiedot" lang={lang}/>
  </Section>

const DecisionContent = ({id,avustushaku,lang}) =>{
  const content = _.get(avustushaku, `decision.${id}.${lang}`,"")
  if(_.isEmpty(content)) return <div></div>
  const paragraphs = content.split("\n")
  return (
      <div>
        {paragraphs.map((p)=><p key={p}>{p}</p>)}
      </div>
  )
}

const Liitteet = ({lang, translations}) =>
  <Section title="liitteet" lang={lang} translations={translations}>
    <Todo>liitteet, hakukohtainen</Todo>
  </Section>

const findCost = (formContent, answers, budgetItem) => Number(InputValueStorage.readValue(formContent, answers, budgetItem.children[1].id))

const Todo = ({children}) => <span className="todo">[TODO: {children}]</span>

const formatNumber = num => num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1\u00A0") + '\u00A0€'
