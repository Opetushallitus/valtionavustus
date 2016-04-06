import PolyfillBind from '../../../../va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import PaatosController from './PaatosController.jsx'
import style from './paatos.less'
import queryString from 'query-string'
import Liitteet from '../data/Liitteet'
import Bacon from 'baconjs'
import HttpUtil from 'va-common/web/HttpUtil.js'
import {Kayttosuunnitelma} from './Kayttosuunnitelma.jsx'
import {formatNumber, formatPrice} from './Formatter'

const privatePath = '/paatos/avustushaku/:avustushaku_id/hakemus/:hakemus_id'
const publicPath = '/public/paatos/avustushaku/:avustushaku_id/hakemus/:hakemus_id'
const isPublic = location.pathname.indexOf('public') >= 0
const parsedRoute = new RouteParser(isPublic ? publicPath : privatePath).match(location.pathname)
parsedRoute.isPublic = isPublic
const controller = new PaatosController()

controller.initializeState(parsedRoute).onValue((state) => {
  try {
    if(state.paatosData) {
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
    const languageAnswer = _.find(hakemus.answers, (a)=>a.key == "language")
    const query = queryString.parse(location.search)
    const lang = query.lang ? query.lang : languageAnswer ? languageAnswer.value : "fi"
    const L = ({translationKey}) => <LocalizedString translationKey={translationKey} translations={translations} lang={lang}/>
    L.lang = lang

    return (
       <section>
         <header>
           <div className="logo"><img src="/img/logo.png" width="200"/></div>
           <div className="title"><L translationKey="paatos" /> {avustushaku.decision.date}</div>
           <div className="registerNumber">{hakemus['register-number']}</div>
           <div className="organization">{hakemus['organization-name']}</div>
         </header>
         <Section title="asia" L={L}>
           <L translationKey="asia-title" />
           <br/>
           {avustushaku.content.name[L.lang]}
         </Section>
         <OptionalSection title="taustaa" id="taustaa" avustushaku={avustushaku} L={L}/>
         {decisionStatus == 'rejected' ?
            <RejectedDecision avustushaku={avustushaku} hakemus={hakemus} role={role} L={L}/> :
            <AcceptedDecision hakemus={hakemus} avustushaku={avustushaku} role={role} formContent={formContent} L={L}/>}
         <SendDecisionButton avustushaku={avustushaku} hakemus={hakemus}/>
       </section>
    )
  }
}

const AcceptedDecision = ({hakemus, avustushaku, role, formContent, L}) => {
  const answers = hakemus.answers
  const iban = _.get(InputValueStorage.readValues(answers, 'iban'), '[0].value', '')
  const bic = _.get(InputValueStorage.readValues(answers, 'bic') , '[0].value', '')
  const budgetItems = FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
     .filter(budgetItem => budgetItem.params.incrementsTotal)
     .map(budgetItem => _.extend(budgetItem, {
       original: findCost(formContent, hakemus.answers, budgetItem),
       overridden: findCost(formContent, hakemus.arvio['overridden-answers'], budgetItem)
     }))
  const rahoitusItems = FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
     .filter(budgetItem => !budgetItem.params.incrementsTotal)
     .map(budgetItem => _.extend(budgetItem, {
       original: findCost(formContent, hakemus.answers, budgetItem)
     }))
  const totalOriginalCosts = formatPrice(_.sum(budgetItems.map(i=>Number(i.original))))
  const totalCosts = formatPrice(hakemus.arvio.useDetailedCosts ? _.sum(budgetItems.map(i=>Number(i.overridden))) : hakemus.arvio.costsGranted)
  const totalRahoitus = formatPrice(_.sum(rahoitusItems.map(i=>Number(i.original))))
  const totalGranted = formatPrice(hakemus.arvio['budget-granted'])
  const koulutusosiot = hakemus.answers.find(item => item.key === 'koulutusosiot')
  return (
     <section>
       <Section title="paatos" L={L}>
         <p><L translationKey="myonnetty-title" />:</p>
         <p><L translationKey="hakija" />: {hakemus['organization-name']}<br/>
           <L translationKey="hanke" />: {hakemus['project-name']}
         </p>
         <p><L translationKey="paatos-myonnetty-1" /> {totalCosts}&nbsp;.&nbsp;
           <L translationKey="paatos-myonnetty-2" /> {totalGranted}
         </p>
       </Section>
       <Perustelut hakemus={hakemus} L={L}/>
       <Section title="avustuksen-maksu" L={L}>
         <p><L translationKey="avustus-maksetaan" />:
           <strong>{iban}, {bic}</strong></p>
         <DecisionContent avustushaku={avustushaku} id="maksu"/>
       </Section>
       <OptionalSection title="avustuksen-kaytto" id="kaytto" avustushaku={avustushaku} L={L}/>
       <OptionalSection title="kayttooikeudet" id="kayttooikeudet" avustushaku={avustushaku} L={L}/>
       <OptionalSection title="selvitysvelvollisuus" id="selvitysvelvollisuus" avustushaku={avustushaku} L={L}/>
       <OptionalSection title="valtionavustuksen-kayttoaika" id="kayttoaika" avustushaku={avustushaku} L={L}/>
       <Lisatietoja avustushaku={avustushaku} role={role} L={L}/>
       <LiitteetList hakemus={hakemus} avustushaku={avustushaku} L={L}/>
       <Kayttosuunnitelma
          budgetItems={budgetItems}
          rahoitusItems={rahoitusItems}
          avustushaku={avustushaku}
          hakemus={hakemus}
          totalCosts={totalCosts}
          totalOriginalCosts={totalOriginalCosts}
          totalGranted={totalGranted}
          totalRahoitus={totalRahoitus}
          L={L}
       />
       {koulutusosiot && <Koulutusosiot list={koulutusosiot.value} answers={hakemus.arvio['overridden-answers'].value}/>}
     </section>
  )
}

const traineeCalcObj = obj => ({
  scope: findByKeyEnd(obj, '.scope'),
  personCount: findByKeyEnd(obj, '.person-count'),
  scopeType: findByKeyEnd(obj, '.scope-type'),
  total:  findByKeyEnd(obj, '.total'),
  totalFormatted:  formatNumber(findByKeyEnd(obj, '.total').replace(',0', ''))
})

const sumTraineeCalculations = list => formatNumber(_.sum(list.map(x=>Number(x.replace(',', '.')))))

const Koulutusosiot = ({list, answers}) => {
  var rows = list
    .map(x => {
      var value = x.value
      var appliedObj = FormUtil.findFieldsByFieldType(value, 'vaTraineeDayCalculator')[0]
      var grantedRowObj = answers.find(answer => answer.key === appliedObj.key).value
      return {
        name: _.get(FormUtil.findFieldsByFieldType(value, 'nameField'), '[0].value', ''),
        applied: traineeCalcObj(appliedObj.value),
        granted: traineeCalcObj(grantedRowObj)
      }
    })
  return <section className="section">
    <p>Valtionavustusta / määrärahaa voidaan käyttää seuraaviin koulutusosioihin:</p>
    <table>
      <thead>
      <tr>
        <th rowSpan="2" >Koulutusosiot</th>
        <th colSpan="2" className="groupTitle">Laajuus</th>
        <th colSpan="2" className="groupTitle">Osallistujat</th>
        <th colSpan="2" className="groupTitle">Koulutettavatpäivät</th>
      </tr>
      <tr>
        <th className="amount">Haettu</th>
        <th className="amount">Myönnetty</th>
        <th className="amount">Haettu</th>
        <th className="amount">Myönnetty</th>
        <th className="amount">Haettu</th>
        <th className="amount">Myönnetty</th>
      </tr>
      </thead>
      <tbody>
      {rows
        .map((row, i) => <tr key={i}>
          <td>{row.name}</td>
          <td className="amount">{row.applied.scope} {row.applied.scopeType}</td>
          <td className="amount">{row.granted.scope} {row.granted.scopeType}</td>
          <td className="amount">{row.applied.personCount}</td>
          <td className="amount">{row.granted.personCount}</td>
          <td className="amount">{row.applied.totalFormatted}</td>
          <td className="amount">{row.granted.totalFormatted}</td>
        </tr>)}
      </tbody>
      <tfoot>
      <tr>
        <th colSpan="5">Koulutettavatpäivät yhteensä</th>
        <th className="amount">{sumTraineeCalculations(rows.map(x=>x.applied.total))}</th>
        <th className="amount">{sumTraineeCalculations(rows.map(x=>x.granted.total))}</th>
      </tr>
      </tfoot>
    </table>
  </section>
}

const findByKeyEnd = (list, keyEnd) => _.get(list.find(x => x.key.endsWith(keyEnd)), 'value', '')

class SendDecisionButton extends React.Component {
  constructor(props) {
    super(props)
    this.state = {sent: false}
  }

  render() {
    const onFindEmail = () => {
      const hakemus = this.props.hakemus
      const emailsS = Bacon.fromPromise(HttpUtil.get(`/api/paatos/emails/${hakemus.id}`))
      emailsS.onValue((res)=> {
           this.setState({...this.state, emails: res.emails.join(" ")})
         }
      )
    }

    const onSend = () => {
      const hakemus = this.props.hakemus
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/paatos/send/${hakemus.id}`, {email: this.state.emails}))
      sendS.onValue((res)=> {
           this.setState({...this.state, sentEmails: res.emails.join(" ")})
         }
      )
    }

    const onEmailChanges = (event) => {
      this.setState({emails: event.target.value})
    }

    if(isPublic) return null;
    return (
       <div>
         <div hidden={!this.state.sentEmails}>Päätös lähetetty osoitteisiin: <strong>{this.state.sentEmails}</strong>
         </div>
         <input type="text" value={this.state.emails} onChange={onEmailChanges} size="60" hidden={!this.state.emails}/>
         <button onClick={onFindEmail} hidden={this.state.emails}>Päätös sähköposti</button>
         <button onClick={onSend} hidden={!this.state.emails}>Lähetä</button>
       </div>
    )
  }
}

const RejectedDecision = ({avustushaku, hakemus, role, L}) =>
   <section>
     <Section title="paatos" L={L}>
       <p><L translationKey="hylatty-title" /></p>
       <p><L translationKey="hakija" />: {hakemus['organization-name']}<br/>
         <L translationKey="hanke" />: {hakemus['project-name']}
       </p>
     </Section>
     <Perustelut hakemus={hakemus} L={L}/>
     <Lisatietoja avustushaku={avustushaku} role={role} L={L}/>
     <LiitteetList hakemus={hakemus} avustushaku={avustushaku} L={L}/>
   </section>

const Section = ({title, content, children, L})=> {
  return (
     <section className="section" hidden={!content && !children}>
       <h2><L translationKey={title}/></h2>
       <div className="content">
         {children || content}
       </div>
     </section>
  )
}

const OptionalSection = ({title,id, avustushaku, L}) => {
  const content = _.get(avustushaku, `decision.${id}.${L.lang}`, "")
  return _.isEmpty(content) ? <div></div> : (
     <Section title={title} L={L}>
       <ContentWithParagraphs content={content}/>
     </Section>
  )
}

const Perustelut = ({hakemus, L}) =>
   _.isEmpty(hakemus.arvio.perustelut) ? <div></div> :
      <Section title="paatoksen-perustelut" L={L}>
        <ContentWithParagraphs content={hakemus.arvio.perustelut}/>
      </Section>

const Lisatietoja = ({avustushaku, role, L})=>
   <Section title="lisatietoja" L={L}>
     <p><L translationKey="lisatietoja-antaa" />: {role.name} &lt;{role.email}&gt;</p>
     <DecisionContent avustushaku={avustushaku} id="lisatiedot" lang={L.lang}/>
   </Section>

const DecisionContent = ({id, avustushaku, lang}) => {
  const content = _.get(avustushaku, `decision.${id}.${lang}`, "")
  return _.isEmpty(content) ? <div></div> : (
     <div>
       <ContentWithParagraphs content={content}/>
     </div>
  )
}

const LiitteetList = ({hakemus,avustushaku, L})=> {
  const liitteet = _.get(avustushaku, "decision.liitteet", [])
  const decisionStatus = hakemus.arvio.status
  const rejected = decisionStatus == 'rejected'

  const ehdot = findLiite(Liitteet, liitteet, "Ehdot")
  const oikaisuvaatimus = findLiite(Liitteet, liitteet, "Oikaisuvaatimusosoitus")

  const AcceptedAttachments =
     <div>
       <div><L translationKey="kayttosuunnitelma"/></div>
       <div><LiiteRow liite={ehdot} lang={L.lang}/></div>
     </div>
  const RejectedAttachments = null
  return (
     <Section title="liitteet" L={L}>
       {rejected ? RejectedAttachments : AcceptedAttachments}
       <div><LiiteRow liite={oikaisuvaatimus} lang={L.lang}/></div>
     </Section>
  )
}

const findLiite = (allAttachments, attachments, groupName) => {
  const row = _.find(attachments, (g)=>g.group == groupName)
  if(!row) return {}
  const group = _.find(allAttachments, (r)=>r.group == row.group)
  return _.find(group.attachments, (a)=>a.id == row.id)
}

const LiiteRow = ({liite, lang}) => liite.id ?
   <div>
     <a href={`/public/api/liite/${liite.id}/${lang}`} target="_blank">{liite[lang]}</a>
   </div> : <div></div>

const findCost = (formContent, answers, budgetItem) => Number(InputValueStorage.readValue(formContent, answers, budgetItem.children[1].id))

const ContentWithParagraphs = ({content}) => <div>{content.split("\n").map((p)=><p key={p}>{p}</p>)}</div>
