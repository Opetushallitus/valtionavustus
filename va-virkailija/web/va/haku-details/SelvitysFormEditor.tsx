import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import Bacon from 'baconjs'

// @ts-ignore
import HttpUtil from "soresu-form/web/HttpUtil"
// @ts-ignore
import DateUtil from 'soresu-form/web/DateUtil'

import FormEditor from './FormEditor'
import { Lahetys, Tapahtumaloki } from './Tapahtumaloki'

type SelvitysFormEditorProps = {
  avustushaku: any
  controller: any
  translations: any
  koodistos: any
  selvitysType: any
  environment: any
  helpTexts: any
  formDraft: any
}

export const SelvitysFormEditor = (props: SelvitysFormEditorProps) => {
  const [count, setCount] = useState<number | undefined>(undefined)
  const [sending, setSending] = useState(false)
  const [lahetykset, setLahetykset] = useState<Lahetys[]>([])

  const { avustushaku, controller, translations, koodistos, selvitysType, environment, helpTexts, formDraft } = props
  const formContent = avustushaku[selvitysType + "Form"]
  const updatedAtElementId = `${selvitysType}UpdatedAt`
  const updatedAt = formContent?.updated_at
  const formattedUpdatedDate = `${DateUtil.asDateString(updatedAt)} klo ${DateUtil.asTimeString(updatedAt)}`

  const previewUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/" + selvitysType
  const previewUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/" + selvitysType + "?lang=sv"
  const onFormChange = (avustushaku, newDraftJson) =>{
    controller.selvitysFormOnChangeListener(avustushaku, newDraftJson, selvitysType)
  }

  const onJsonChange = e => {
    controller.selvitysFormOnChangeListener(avustushaku, e.target.value, selvitysType)
  }

  const onSaveForm = () => {
    controller.saveSelvitysForm(avustushaku, formDraft, selvitysType)
  }
  const scrollToTop = () => {
    window.scrollTo(0, 0)
  }

  let parsedForm = formDraft
  let parseError = false
  try {
    parsedForm = JSON.parse(formDraft)
  } catch (error) {
    parseError = error.toString()
  }

  function formHasBeenEdited() {
    return formDraft && formContent && !_.isEqual(parsedForm, formContent)
  }

  const disableSave = parseError !== false || !formHasBeenEdited()

  const recreateForm = () => {
    controller.selvitysFormOnRecreate(avustushaku, selvitysType)
  }

  const onSendSelvitys = () => {
    setSending(true)
    HttpUtil.post(`/api/avustushaku/${avustushaku.id}/selvitys/${selvitysType}/send-notification`)
      .then(response => {
        setCount(response.count)
        setSending(false)
        fetchTapahtumaloki()
      })
  }

  const fetchTapahtumaloki = () => {
    setLahetykset([])
    const tapahtumaloki = Bacon.fromPromise<any, Lahetys[]>(HttpUtil.get(`/api/avustushaku/${avustushaku.id}/tapahtumaloki/${selvitysType}_lahetys`))
    tapahtumaloki.onValue(setLahetykset)
  }

  useEffect(() => {
    setCount(undefined)
    setSending(false)
    fetchTapahtumaloki()
  }, [avustushaku.id, selvitysType])

  const valiselvitysSection = <div>
    <h4>Väliselvitysten lähettäminen</h4>
    <p>Väliselvitys tulee toimittaa viimeistään <strong>{avustushaku[selvitysType + 'date']}</strong>.</p>
    <p>Väliselvityspyynnöt lähetetään niille hakijoille, joiden hakemukset on hyväksytty ja jotka eivät ole vielä toimittaneet väliselvitystä.</p>
    <p data-test-id='valiselvitys-ohje' dangerouslySetInnerHTML={{__html: helpTexts["hakujen_hallinta__väliselvitys___ohje"]}} />
    <button data-test-id='send-valiselvitys' disabled={sending} onClick={onSendSelvitys}>Lähetä väliselvityspyynnöt</button>
    {count !== undefined && <span> Lähetetty {count} viestiä</span>}
    {!!lahetykset.length && <Tapahtumaloki lahetykset={lahetykset} />}
    <h1>Väliselvityslomake</h1>
  </div>

  const loppuSelvitysSection = <div>
    <h4>Loppuselvityksen lähettäminen</h4>
    <p>Loppuselvitys on koko ajan täytettävissä ja se tulee toimittaa viimeistään <strong>{avustushaku[selvitysType + 'date']}</strong>.</p>
    <p>Loppuselvityspyynnöt lähetetään niille hakijoille, joiden hakemukset on hyväksytty ja jotka eivät ole vielä toimittaneet loppuselvitystä.</p>
    <p data-test-id='loppuselvitys-ohje' dangerouslySetInnerHTML={{__html: helpTexts["hakujen_hallinta__loppuselvitys___ohje"]}} />
    <button data-test-id='send-loppuselvitys' disabled={sending} onClick={onSendSelvitys}>Lähetä loppuselvityspyynnöt</button>
    {count !== undefined && <span> Lähetetty {count} viestiä</span>}
    {!!lahetykset.length && <Tapahtumaloki lahetykset={lahetykset} />}
    <h1>Loppuselvityslomake</h1>
  </div>

  return (
    <div>
      {selvitysType === 'valiselvitys' ? valiselvitysSection : loppuSelvitysSection}
      <button style={{float:'right'}} onClick={recreateForm}>Palauta alkuperäiset kysymykset</button>
      {updatedAt && <div id={updatedAtElementId} style={{float:'right',marginRight:20}}>Päivitetty: {formattedUpdatedDate}</div>}
      <div className="link-list">
        <div className="link-list-item">
          <h3>Lomakkeen esikatselu</h3>
          <a target="_blank"
              rel="noopener noreferrer"
              href={previewUrlFi}>
            Suomeksi
          </a>
          <span className="link-divider"/>
          <a target="_blank"
              rel="noopener noreferrer"
              href={previewUrlSv}>
            Ruotsiksi
          </a>
        </div>
      </div>
      <FormEditor avustushaku={avustushaku} translations={translations} formDraft={formDraft} koodistos={koodistos} controller={controller} onFormChange={onFormChange} />
      <div className="form-json-editor">
        <h3>Hakulomakkeen sisältö</h3>
        <span className="error">{parseError}</span>
        <div className="btn-fixed-container">
          <button className="btn-fixed" type="button" onClick={scrollToTop}>Takaisin ylös</button>
          <button className="btn-fixed" type="button" onClick={onSaveForm} disabled={disableSave}>Tallenna</button>
        </div>
        <textarea onChange={onJsonChange} value={formDraft}/>
      </div>
    </div>
  )
}
