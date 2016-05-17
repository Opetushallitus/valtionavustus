import PolyfillBind from '../../polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import ArrayFindPolyfill from 'array-find-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import InputValueStorage from '../../../../soresu-form/web/form/InputValueStorage'
import FormUtil from '../../../../soresu-form/web/form/FormUtil'
import LocalizedString from '../../../../soresu-form/web/form/component/LocalizedString.jsx'
import PaatosController from './PaatosController.jsx'
//import style from './paatos.less'
import queryString from 'query-string'
import Liitteet from '../data/Liitteet'
import Bacon from 'baconjs'
import HttpUtil from '../../HttpUtil.js'
import {Kayttosuunnitelma} from './Kayttosuunnitelma.jsx'
import {formatPrice} from './Formatter'
import {Koulutusosiot} from './Koulutusosiot.jsx'

const parsedRoute = new RouteParser('/paatos/avustushaku/:avustushaku_id/hakemus/:hakemus_id').match(location.pathname)
const controller = new PaatosController()

controller.initializeState(parsedRoute).onValue((state) => {
  if(state.paatosData) {
    ReactDOM.render(<PaatosApp state={state} controller={controller}/>, document.getElementById('app'))
  }
})

export default class PaatosApp extends Component {
  render() {
    const {hakemus, avustushaku, roles, form, ispublic} = this.props.state.paatosData
    const decisionStatus = hakemus.arvio.status
    const selectedRoleId = hakemus.arvio['presenter-role-id']
    const role = selectedRoleId ? roles.find(role => role.id === selectedRoleId) : roles[0]
    const formContent = form.content
    const translations = this.props.state.translations.paatos
    const languageAnswer = _.find(hakemus.answers, (a)=>a.key == "language")
    const query = queryString.parse(location.search)
    const lang = query.lang ? query.lang : languageAnswer ? languageAnswer.value : "fi"
    const L = ({translationKey}) => _.isEmpty(translationKey) ? <span/> : <LocalizedString translationKey={translationKey} translations={translations} lang={lang}/>
    L.lang = lang

    return (
       <section>
         <header>
           <div className="logo"><img src="/img/logo.png" width="200"/></div>
           <div className="title"><L translationKey="paatos" /> <br/>{avustushaku.decision.date}</div>
           <div className="registerNumber">{hakemus['register-number']}</div>
           <div className="organization">{hakemus['organization-name']}</div>
         </header>
         <Section title="asia" L={L}>
           <L translationKey="asia-title" />
         </Section>
         <OptionalSection title="taustaa" id="taustaa" avustushaku={avustushaku} L={L}/>
         {decisionStatus == 'rejected' ?
            <RejectedDecision avustushaku={avustushaku} hakemus={hakemus} role={role} L={L}/> :
            <AcceptedDecision hakemus={hakemus} avustushaku={avustushaku} role={role} formContent={formContent} L={L}/>}
         <SendDecisionButton avustushaku={avustushaku} hakemus={hakemus} isPublic={ispublic}/>
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
  const totalGranted = hakemus.arvio['budget-granted']
  const koulutusosiot = hakemus.answers.find(item => item.key === 'koulutusosiot')
  const selfFinancingPercentage = avustushaku.content["self-financing-percentage"]
  const ophFinancingPercentage = 100-selfFinancingPercentage
  return (
     <section>
       <Section title="paatos" L={L}>
         <p><L translationKey="myonnetty-title" /></p>
         <p>{hakemus['register-number']} {hakemus['project-name']}
         </p>
         <p><L translationKey="paatos-myonnetty-1" /> {formatPrice(totalGranted)}&nbsp;.&nbsp;
           <L translationKey="paatos-myonnetty-2" /> {formatPrice(Math.ceil(totalGranted/ophFinancingPercentage*100))}.
         </p>
         <p><L translationKey="paatos-myonnetty-3" /> {selfFinancingPercentage>0 ? <span><L translationKey="valtionavustusprosentti-on" /> {ophFinancingPercentage}%</span> : null}</p>
         <DecisionContent avustushaku={avustushaku} id="myonteinenlisateksti" lang={L.lang}/>
         <p>
           <L translationKey="paatos-myonnetty-4" />

         </p>
       </Section>
       <Perustelut hakemus={hakemus} L={L}/>
       <OptionalSection title="sovelletut-saannokset" id="sovelletutsaannokset" avustushaku={avustushaku} L={L}/>
       <AvustuksenMaksu L={L} iban={iban} bic={bic} avustushaku={avustushaku} totalPaid={totalGranted}/>
       <Section title="avustuksen-kayttotarkoitus" L={L}>
         <p><L translationKey="kaytto1"/></p>
         <p><L translationKey="kaytto2"/></p>
         <p><L translationKey="kaytto3"/></p>
         <p><L translationKey="kaytto4"/></p>
       </Section>
       <OptionalSection title="valtionavustuksen-kayttoaika" id="kayttoaika" avustushaku={avustushaku} L={L}/>
       <OptionalSection title="selvitysvelvollisuus" id="selvitysvelvollisuus" avustushaku={avustushaku} L={L}/>
       <Section title="tarkastusoikeus-title" L={L}>
           <L translationKey="tarkastusoikeus-text" />
       </Section>
       <OptionalSection title="kayttooikeudet" id="kayttooikeudet" avustushaku={avustushaku} L={L}/>
       <OptionalSection title="hyvaksyminen" id="hyvaksyminen" avustushaku={avustushaku} L={L}/>
       <Lisatietoja avustushaku={avustushaku} role={role} L={L}/>
       <LiitteetList hakemus={hakemus} avustushaku={avustushaku} L={L}/>
       <Kayttosuunnitelma
          formContent={formContent}
          avustushaku={avustushaku}
          hakemus={hakemus}
          L={L}
       />
       {koulutusosiot && <Koulutusosiot list={koulutusosiot.value} answers={hakemus.arvio['overridden-answers'].value} L={L} />}
     </section>
  )
}
//<SelvitysVelvollisuus L={L} avustushaku={avustushaku}/>
const SelvitysVelvollisuus = ({L,avustushaku}) =>
  <Section title="selvitysvelvollisuus" L={L}>
    {avustushaku.valiselvitysdate &&
    <div>
      Väliselvitys avautuu täytettäväksi {avustushaku.valiselvitysdate} ja löydätte selvityksen kysymyksineen osoitteesta <a>linkki</a>
    </div>
    }
    Loppuselvitys tulee palauttaa 2kk hankkeen päättymisestä tai viimeistään {avustushaku.loppuselvitysdate}.
    Loppuselvitykseen pääsette tästä linkistä.
  </Section>

const AvustuksenMaksu  = ({L,avustushaku,bic,iban,totalPaid}) =>{
  const maksudate = _.get(avustushaku, `decision.maksudate`, "")
  const maksu = _.get(avustushaku, `decision.maksu.${L.lang}`, "")
  const multipleMaksuera = avustushaku.content.multiplemaksuera===true && totalPaid > 60000
  const firstRoundPaid = multipleMaksuera ? Math.round(0.6*totalPaid) : totalPaid
  const paidFormatted = formatPrice(firstRoundPaid)
  return (
    <Section title="avustuksen-maksu" L={L}>
      <p><L translationKey="avustus-maksetaan" />: <strong>{iban}, {bic}</strong></p>
      <p><L translationKey="maksuerat-ja-ajat" />: {paidFormatted} {maksu}{!multipleMaksuera && <span>.</span>} {multipleMaksuera && <span><L translationKey="ja-loppuera-viimeistaan" /> {maksudate}.</span>} </p>
    </Section>
  )
}

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
    if(this.props.isPublic) return null;
    return (
       <section className="section sendEmails">
         <div hidden={!this.state.sentEmails}>Päätös lähetetty osoitteisiin: <strong>{this.state.sentEmails}</strong>
         </div>
         <input type="text" value={this.state.emails} onChange={onEmailChanges} size="60" hidden={!this.state.emails}/>
         <button onClick={onFindEmail} hidden={this.state.emails}>Päätös sähköposti</button>
         <button onClick={onSend} hidden={!this.state.emails}>Lähetä</button>
       </section>
    )
  }
}

const RejectedDecision = ({avustushaku, hakemus, role, L}) =>
   <section>
     <Section title="paatos" L={L}>
       <p><L translationKey="hylatty-title" /></p>
       <p>{hakemus['register-number']} {hakemus['project-name']}
       </p>
     </Section>
     <Perustelut hakemus={hakemus} L={L}/>
     <OptionalSection title="sovelletut-saannokset" id="sovelletutsaannokset" avustushaku={avustushaku} L={L}/>
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
     <p>{role.name}, {role.email}</p>
     <p><L translationKey="puhelin"/> 029 533 1000 (<L translationKey="keskus"/>).</p>
     <L translationKey="lisatietoja-sisalto"/>
     <DecisionContent avustushaku={avustushaku} id="johtaja" lang={L.lang} className="signature"/>
     <DecisionContent avustushaku={avustushaku} id="esittelija" lang={L.lang} className="signature"/>
   </Section>

const DecisionContent = ({id, avustushaku, lang,className=""}) => {
  const content = _.get(avustushaku, `decision.${id}.${lang}`, "")
  return _.isEmpty(content) ? <div></div> : (
     <div className={className}>
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
  const yleisohje = {
    id:"va_yleisohje",
    fi:"Valtionavustusten yleisohje",
    sv:"Allmänna anvisningar om statsunderstöd"
  }

  const AcceptedAttachments =
     <div>
       <div><L translationKey="kayttosuunnitelma"/></div>
       <div><LiiteRow liite={oikaisuvaatimus} lang={L.lang}/></div>
       <div><LiiteRow liite={ehdot} lang={L.lang}/></div>
       <div><LiiteRow liite={yleisohje} lang={L.lang}/></div>
     </div>
  const RejectedAttachments = <div><LiiteRow liite={oikaisuvaatimus} lang={L.lang}/></div>
  return (
     <Section title="liitteet" L={L}>
       {rejected ? RejectedAttachments : AcceptedAttachments}
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

const ContentWithParagraphs = ({content}) => <div>{content.split("\n").map((p,index)=><p key={index}>{p}</p>)}</div>
