import React from 'react'
import _ from 'lodash'
import Bacon from 'baconjs'

import DateUtil from 'soresu-form/web/DateUtil'
import HttpUtil from 'soresu-form/web/HttpUtil'

import PaatosUrl from '../hakemus-details/PaatosUrl'
import Selvitys from './Selvitys.jsx'

const DecisionField = ({avustushaku, title, id,language, onChange}) => {
  const fieldId= `decision.${id}.${language}`
  const value = _.get(avustushaku, fieldId, "")
  const titleLanguage = language === "sv" ? `${title} ruotsiksi` : title
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
  constructor(props) {
    super(props)
    this.state = {value: this.value(props, props.field)}
    this.onChange = this.onChange.bind(this)
  }

  value(props,field) {
    return _.get(props.avustushaku, `decision.${field}`, "") || ""
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.avustushaku.id !== this.props.avustushaku.id) {
      this.setState({value: this.value(nextProps, nextProps.field)})
    }
  }

  onChange(event) {
    this.setState({value: event.target.value})
    this.props.controller.onChangeListener(this.props.avustushaku, event.target, event.target.value)
  }

  render() {
    return (
      <div className="decision-date">
        <div className="decision-column">
          <span className="decision-date-label">{this.props.label}</span>
          <input type="text"
                 value={this.state.value}
                 id={`decision.${this.props.field}`}
                 onChange={this.onChange}/>
        </div>
      </div>
    )
  }
}

class LiitteetSelection extends React.Component {
  constructor(props) {
    super(props)
    const selectedLiitteet = _.get(this.props.avustushaku, "decision.liitteet", [])
    this.state = {
      selectedLiitteet: this.makeSelectedLiitteet(selectedLiitteet),
      selectedVersions: this.makeSelectedVersions(selectedLiitteet)
    }
    this.onChangeLiite = this.onChangeLiite.bind(this)
    this.onChangeLiiteVersion = this.onChangeLiiteVersion.bind(this)
  }

  makeSelectedLiitteet(selectedLiitteet) {
    const available = this.props.decisionLiitteet

    const findAvailableLiite = liite => {
      const foundGroup = _.find(available, l => l.group === liite.group)
      if (!foundGroup) {
        return undefined
      }
      return _.find(foundGroup.attachments, l => l.id === liite.id)
    }

    return _.reduce(selectedLiitteet, (acc, l) => {
      const foundSelected = findAvailableLiite(l)
      if (foundSelected) {
        acc[l.group] = foundSelected.id
      }
      return acc
    }, {})
  }

  makeSelectedVersions(selectedLiitteet) {
    const candidateVersionsInSelectedLiitteet = _.reduce(selectedLiitteet, (acc, l) => {
      acc[l.id] = l.version
      return acc
    }, {})

    return _.reduce(this.props.decisionLiitteet, (acc, g) => {
      _.forEach(g.attachments, a => {
        const userSelectedVersion = candidateVersionsInSelectedLiitteet[a.id]
        const isVersionAvailable = userSelectedVersion !== undefined && _.find(a.versions, v => v.id === userSelectedVersion) !== undefined
        acc[a.id] = isVersionAvailable ? userSelectedVersion : _.last(a.versions).id
      })
      return acc
    }, {})
  }

  onChangeLiite(event) {
    const {
      value: liiteId,
      checked: isChecked
    } = event.target
    const liiteGroup = event.target.dataset.group
    this.setState(state => {
      const selectedLiitteet = isChecked
        ? _.assign({}, state.selectedLiitteet, {[liiteGroup]: liiteId})
        : _.omit(state.selectedLiitteet, [liiteGroup])
      this.updateSelectedLiitteet(selectedLiitteet, state.selectedVersions)
      return {selectedLiitteet}
    })
  }

  onChangeLiiteVersion(event) {
    const versionId = event.target.value
    const liiteId = event.target.dataset.liite
    this.setState(state => {
      const selectedVersions = _.assign({}, state.selectedVersions, {[liiteId]: versionId})
      this.updateSelectedLiitteet(state.selectedLiitteet, selectedVersions)
      return {selectedVersions}
    })
  }

  updateSelectedLiitteet(selectedLiitteet, selectedVersions) {
    const liitteet = _.map(selectedLiitteet, (liiteId, groupId) => ({
      group: groupId,
      id: liiteId,
      version: selectedVersions[liiteId]
    }))
    this.props.controller.onChangeListener(this.props.avustushaku, {id: "decision.liitteet"}, liitteet)
  }

  render() {
    return (
      <div>
        <h4>Päätöksen liitteet</h4>
        <div className="decision-liite-selection">
          {_.map(this.props.decisionLiitteet, group => this.renderLiiteGroup(group))}
        </div>
      </div>
    )
  }

  renderLiiteGroup(group) {
    return (
      <div key={group.group}>
        <h5>{group.group}</h5>
        {_.map(group.attachments, attachment => this.renderLiite(attachment, group.group))}
      </div>
    )
  }

  renderLiite(attachment, groupId) {
    const isSelected = this.state.selectedLiitteet[groupId] === attachment.id

    return (
      <div key={attachment.id} className="decision-liite-selection__liite">
        <label>
          <input type="checkbox"
                 className="decision-liite-selection__liite-input"
                 data-group={groupId}
                 name={"decision-liite-group--" + groupId}
                 value={attachment.id}
                 checked={isSelected}
                 onChange={this.onChangeLiite} />
          {attachment.langs.fi} <span className="decision-liite-selection__liite-id">{attachment.id}</span>
        </label>
        {attachment.versions.length > 1
          ? <div>{_.map(attachment.versions, v => this.renderLiiteVersion(attachment, isSelected, v))}</div>
          : this.renderLiiteVersionLinks(attachment.id, attachment.versions[0].id)
        }
      </div>
    )
  }

  renderLiiteVersion(attachment, isLiiteSelected, versionSpec) {
    const isSelected = this.state.selectedVersions[attachment.id] === versionSpec.id

    return (
      <label key={"v" + versionSpec.id} className="decision-liite-selection__liite-version">
        <input type="radio"
               className="decision-liite-selection__liite-version-input"
               data-liite={attachment.id}
               name={"decision-liite-version--" + attachment.id}
               value={versionSpec.id}
               checked={isSelected}
               onChange={this.onChangeLiiteVersion}
               disabled={!isLiiteSelected} />
        {versionSpec.description}
        {this.renderLiiteVersionLinks(attachment.id, versionSpec.id)}
      </label>
    )
  }

  renderLiiteVersionLinks(attachmentId, versionSuffix) {
    return (
      <span>
        {_.map(["fi", "sv"], lang => this.renderLiiteVersionLink(attachmentId, versionSuffix, lang))}
      </span>
    )
  }

  renderLiiteVersionLink(attachmentId, versionId, lang) {
    const hakijaUrl = this.props.environment["hakija-server"].url[lang]
    const linkUrl = `${hakijaUrl}liitteet/${attachmentId}${versionId}_${lang}.pdf`
    return <a key={lang}
              className="decision-liite-selection__link"
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer">
             {lang}
           </a>
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
      sendS.onValue(() => {
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

class ResendDecisions extends React.Component {
  constructor(props){
    super(props)
    this.state = {completed:false,confirm:false}
  }

  render(){
    const avustushaku = this.props.avustushaku

    const onConfirm = () =>{
      this.setState({confirm:true})
    }

    const onResend = () =>{
      this.setState({resending:true, resendError: undefined, completed: false})
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/paatos/resendall/${avustushaku.id}`,{}))
      sendS.onValue(() => {
        this.setState({completed:true, resending: false})
        this.props.reload()
      })
      sendS.onError(err => {
        const setPäätösResendError = errorText =>
          this.setState({resending: false, resendError: errorText, confirm: false})
        if (err.name === "HttpResponseError" && err.response.status === 400) {
          setPäätösResendError(err.response.data.error)
        } else {
          setPäätösResendError("Odottamaton virhe tapahtui lähettäessä päätöksiä")
        }
        this.props.reload()
      })
    }

    const resending = this.state.resending
    return (
      <div>
        {this.state.resending && <div><img src="/img/ajax-loader.gif"/>&nbsp;<strong>Päätöksiä lähetetään uudelleen...</strong></div>}
        {this.state.completed && <div style={{fontWeight:'bold',marginBottom:10,marginTop:10}}>Päätökset lähetetty uudelleen</div>
        }
        {!this.state.completed &&
          <div>
            {this.state.confirm && <button onClick={onResend} disabled={resending}>{resending ? "Lähetetään" :  "Vahvista päätösten uudellenlähetys"}</button>}
            {!this.state.confirm && <button onClick={onConfirm}>Lähetä {this.props.sent} päätöstä uudelleen</button>}
          </div>
        }
        {this.state.resendError && <p id="päätös-resend-error" className="error">{this.state.resendError}</p>}

      </div>
    )
  }
}

class TapahtumaLoki extends React.Component {

  dateTime(d) {
    return `${DateUtil.asDateString(d)} ${DateUtil.asTimeString(d)}`
  }

  groupBy(key) {
    return (array) => (
      array.reduce((objectsByKeyValue, obj) => {
        const value = obj[key];
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
      }, {})
    )
  }

  render() {

    const latestFirst = (a, b) => {
      if (a[0].created_at > b[0].created_at) return -1
      if (a[0].created_at < b[0].created_at) return 1
      return 0
    }

    const timestamp = (entries) => this.dateTime(entries[0].created_at) // Assume mails have same approx sent time
    const sender = (entries) => entries[0].user_name // Assume that all entries within same batch have the same sender
    const sentMails = (entries) => entries.filter(e => e.success).length
    const failedMails = (entries) => entries.filter(e => !e.success).length

    // List of lists, each of which contain all sent emails sent by one transaction (i.e. batch_id), e.g. "lähetä päätökset"
    const groupedLahetykset = Object.values(this.groupBy('batch_id')(this.props.lahetykset)).sort(latestFirst)

    return (
      <div className={'tapahtumaloki'}>
        <div className={'header'}>Lähetetyt päätökset</div>
        <div className={'entries'}>
          <div className={'header-row'}>
            <span className={'timestamp header'}>Lähetysaika</span>
            <span className={'sender header'}>Lähettäjä</span>
            <span className={'sentCount header'}>Lähetettyjä viestejä</span>
            <span className={'failedCount header'}>Epäonnistuneita lähetyksiä</span>
          </div>
        {
          groupedLahetykset.map((l, i) => (
            <div key={i} className={'entry'}>
              <span className={'timestamp'}>{timestamp(l)}</span>
              <span className={'sender'}>{sender(l)}</span>
              <span className={'sentCount'}>{sentMails(l)}</span>
              <span className={'failedCount'}>{failedMails(l)}</span>
            </div>
          ))
        }
        </div>
      </div>
    )
  }
}

class DecisionDateAndSend extends React.Component {
  constructor(props){
    super(props)
    this.state = {preview:false, refuseEnabled: props.environment["application-change"]["refuse-enabled?"]}
    this.rerenderParentCallback = this.rerenderParentCallback.bind(this);
    this.fetchLahetetytPaatokset = this.fetchLahetetytPaatokset.bind(this)
  }

  rerenderParentCallback() {
    this.fetchEmailState(this.props.avustushaku.id)
    this.fetchLahetetytPaatokset(this.props.avustushaku.id)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.avustushaku.id !== this.props.avustushaku.id) {
      this.setState({preview:false,count:undefined,sending:false})
      this.fetchEmailState(nextProps.avustushaku.id)
    }
  }

  componentDidMount() {
    this.fetchEmailState(this.props.avustushaku.id)
    this.fetchLahetetytPaatokset(this.props.avustushaku.id)
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
      {this.state.refuseEnabled &&
         <span>
          Huomaathan, että linkkiä avustuksen hylkäämiseen ei lisätä hylättyyn
          päätökseen.
        </span>
      }
      <div className="decision-separator"/>
      {this.sendControls(this.rerenderParentCallback)}
    </div>
  }

  sentOk() { return _.isNumber(this.state.count) && this.state.count === this.state.sent }

  mailsToSend() { return !this.sentOk() && !this.state.sending }

  mailsToSendLabel() {
    if (this.sentOk()) {
      return '0'
    }
    //If, for some reason not all of the mails have been sent
    if (this.state.sent !== 0 && this.state.count > 0) {
      return `${(this.state.count-this.state.sent)}/${this.state.count}`
    }
    return this.state.count + ''
  }

  fetchEmailState(avustushakuId) {
    const sendS = Bacon.fromPromise(HttpUtil.get(`/api/paatos/sent/${avustushakuId}`,{}))
    sendS.onValue(res => {
      this.setState({
        ...this.state,
        count: res.count,
        sent: res.sent,
        mail: res.mail,
        sentTime: res['sent-time'],
        exampleUrl: res['example-url'],
        exampleRefuseUrl: res['example-refuse-url'],
        paatokset: res.paatokset
      })
    })
  }

  fetchLahetetytPaatokset(avustushakuId) {
    const sendS = Bacon.fromPromise(HttpUtil.get(`/api/paatos/tapahtuma/lahetys/${avustushakuId}`,{}))
    sendS.onValue(lahetykset => {
      this.setState({ lahetykset })
    })
  }

  hasLahetetytPaatokset() {
    return typeof this.state.lahetykset !== 'undefined'
      && Array.isArray(this.state.lahetykset)
      && this.state.lahetykset.length > 0
  }

  showTapahtumaLokiOrViimeisinLahetys() {
    return this.hasLahetetytPaatokset() ?
      <TapahtumaLoki lahetykset={this.state.lahetykset} /> :
      <strong>{this.state.sent} päätöstä lähetetty {this.sentTimeStamp()}</strong>
  }

  sendControls(rerenderParentCallback) {
    const onPreview = () => {
      this.setState({...this.state, preview:true})
      setTimeout(() => {this.setState({...this.state, preview: false})}, 5000)
    }

    const onSend = () =>{
      this.setState({...this.state,sending: true, preview: false, sendError: undefined})
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/paatos/sendall/${this.props.avustushaku.id}`,{}))
      sendS.onValue((res)=>{
          this.setState({...this.state, count:res.count, sent:res.sent, sentTime: res['sent-time'],paatokset:res.paatokset, sending: false})
          this.fetchLahetetytPaatokset(this.props.avustushaku.id)
        }
      )
      sendS.onError(err => {
        const setPäätösSendError = errorText =>
          this.setState({sending: false, sendError: errorText})
        if (err.name === "HttpResponseError" && err.response.status === 400) {
          setPäätösSendError(err.response.data.error)
        } else {
          setPäätösSendError("Odottamaton virhe tapahtui lähettäessä päätöksiä")
        }
      })
    }

    if (!_.isNumber(this.state.count)) {
      return <img src="/img/ajax-loader.gif"/>
    }

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
      {this.state.sent !== 0 && <ResendDecisions avustushaku={this.props.avustushaku} sent={this.state.sent} reload={rerenderParentCallback}/>}
      {this.state.preview && <button onClick={onSend}>Vahvista lähetys</button>}
      {this.state.sendError && <p id="päätös-send-error" className="error">{this.state.sendError}</p>}

      {this.sentOk() &&
        <div>
          { this.showTapahtumaLokiOrViimeisinLahetys() }
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
                  <td>
                    <a target="_blank"
                       rel="noopener noreferrer"
                       href={PaatosUrl.publicLink(
                         this.props.avustushaku.id,paatos.user_key)}>
                      {paatos.id}
                      {paatos["organization-name"]} - {paatos["project-name"]}
                    </a>
                  </td>
                  <td>{paatos["sent-emails"].addresses.join(" ")}</td>
                  <td style={{position:'relative'}}>
                    {paatos.view_count === 0 && <span>{paatos.view_count}</span>}
                    {paatos.view_count > 0 && <a onClick={onShowViews.bind(this, paatos)}>{paatos.view_count}</a>}
                    {this.state.paatosDetail === paatos.id &&
                      <div className="panel person-panel person-panel--sm person-panel--view-details">
                        <button className="close" onClick={onCloseViews}>x</button>
                        <table className="table">
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
    const mailContent = () => {
          const content = this.state.mail.content.replace(
            "URL_PLACEHOLDER",
            `<a href=${this.state.exampleUrl}>${this.state.exampleUrl}</a>`
          )
      if (this.state.refuseEnabled) {
        return content.replace(
            "REFUSE_URL_PLACEHOLDER",
            `<a href=${this.state.exampleRefuseUrl}>${this.state.exampleRefuseUrl}</a>`)
        }
      else {
      return content
      }
    }


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
    const {
      avustushaku,
      decisionLiitteet,
      environment,
      controller
    } = this.props
    const onChange = (e) => controller.onChangeListener(avustushaku, e.target, e.target.value)
    const fields = [
      {id:"sovelletutsaannokset",title:"Sovelletut säännökset"},
      {id:"kayttooikeudet",title:"Tekijänoikeudet"},
      {id:"kayttotarkoitus",title:"Avustuksen käyttötarkoitus"},
      {id:"kayttoaika",title:"Avustuksen käyttöaika"},
      {id:"selvitysvelvollisuus",title:"Selvitysvelvollisuus"},
      {id:"hyvaksyminen",title:"Päätöksen hyväksyminen"},
      {id:"johtaja",title:"Johtaja"},
      {id:"valmistelija",title:"Esittelijä"}
    ]
    const rahoitusAlueDecisionSubfields = _.isEmpty(avustushaku.content.rahoitusalueet)
      ? []
      : avustushaku.content.rahoitusalueet.map(row => <DecisionFields key={row.rahoitusalue} title={"Myönteisen päätöksen lisäteksti - " + row.rahoitusalue} avustushaku={avustushaku} id={"myonteinenlisateksti-" + row.rahoitusalue.replace(/[\s.]/g, "_")} onChange={onChange}/>)
    return (
      <div className="decision-editor">
        <DecisionFields key="taustaa" title="Taustaa" avustushaku={avustushaku} id="taustaa" onChange={onChange}/>
        <DecisionFields key="myonteinenlisateksti" title="Myönteisen päätöksen lisäteksti" avustushaku={avustushaku} id="myonteinenlisateksti" onChange={onChange}/>
        {rahoitusAlueDecisionSubfields.length > 0  &&
        <div className="decision-subfields">
          {rahoitusAlueDecisionSubfields}
        </div>
        }
        {fields.map((field)=><DecisionFields key={field.id} title={field.title} avustushaku={avustushaku} id={field.id} onChange={onChange}/>)}
        <DecisionFields key="maksu" title="Avustuksen maksuaika" avustushaku={avustushaku} id="maksu" onChange={onChange}/>
        <Selvitys {...this.props}/>
        {avustushaku.content.multiplemaksuera===true && <DateField avustushaku={avustushaku} controller={controller} field="maksudate" label="Viimeinen maksuerä"/>}
        <LiitteetSelection environment={environment} avustushaku={avustushaku} decisionLiitteet={decisionLiitteet} controller={controller}/>
        <DecisionDateAndSend avustushaku={avustushaku} controller={controller} environment={environment}/>
      </div>
    )
  }
}
