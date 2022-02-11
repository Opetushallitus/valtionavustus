import React, { ChangeEvent, useEffect, useState } from 'react'
import _ from 'lodash'
import * as Bacon from 'baconjs'

import HttpUtil from "soresu-form/web/HttpUtil"
import { Avustushaku, Form, HelpTexts, Koodistos, LegacyTranslations } from 'soresu-form/web/va/types'

import FormEditor from './FormEditor'
import { Lahetys, Tapahtumaloki } from './Tapahtumaloki'
import { LastUpdated } from './LastUpdated'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import HakujenHallintaController from '../HakujenHallintaController'

type SelvitysFormEditorProps = {
  avustushaku: Avustushaku
  controller: HakujenHallintaController
  translations: LegacyTranslations
  koodistos: Koodistos
  selvitysType: 'valiselvitys' | 'loppuselvitys'
  environment: EnvironmentApiResponse
  helpTexts: HelpTexts
  formDraft: Form
  formDraftJson: string
}

export const SelvitysFormEditor = (props: SelvitysFormEditorProps) => {
  const [count, setCount] = useState<number | undefined>(undefined)
  const [sending, setSending] = useState(false)
  const [lahetykset, setLahetykset] = useState<Lahetys[]>([])

  const { avustushaku, controller, translations, koodistos, selvitysType, environment, helpTexts, formDraft, formDraftJson } = props
  const formContent = selvitysType === 'valiselvitys' ? avustushaku.valiselvitysForm : avustushaku.loppuselvitysForm
  const updatedAtElementId = `${selvitysType}UpdatedAt`
  const updatedAt = formContent?.updated_at

  const previewUrlFi = environment["hakija-server"].url.fi + "avustushaku/" + avustushaku.id + "/" + selvitysType
  const previewUrlSv = environment["hakija-server"].url.sv + "avustushaku/" + avustushaku.id + "/" + selvitysType + "?lang=sv"
  const onFormChange = (avustushaku: Avustushaku, newDraft: Form) =>{
    controller.selvitysFormOnChangeListener(avustushaku, newDraft, selvitysType)
    controller.selvitysJsonFormOnChangeListener(avustushaku, JSON.stringify(newDraft, null, 2), selvitysType)
  }

  const onJsonChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    controller.selvitysJsonFormOnChangeListener(avustushaku, e.target.value, selvitysType)
    try {
      const parsedDraft = JSON.parse(e.target.value)
      controller.selvitysFormOnChangeListener(avustushaku, parsedDraft, selvitysType)
    } catch (err)
    {
    }
  }

  const onSaveForm = () => {
    controller.saveSelvitysForm(avustushaku, formDraft, selvitysType)
  }
  const scrollToTop = () => {
    window.scrollTo(0, 0)
  }

  let parsedForm = formDraft
  let parseError: string | undefined = undefined
  try {
    parsedForm = JSON.parse(formDraftJson)
  } catch (error: unknown) {
    if (error instanceof Error) {
      parseError = error.toString()
    } else {
      parseError = `Unknown error: ${error}`
    }
  }

  function formHasBeenEdited() {
    return formDraft && formContent && !_.isEqual(parsedForm, formContent)
  }

  const disableSave = !!parseError || !formHasBeenEdited()

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
    const tapahtumaloki = Bacon.fromPromise<Lahetys[]>(HttpUtil.get(`/api/avustushaku/${avustushaku.id}/tapahtumaloki/${selvitysType}-notification`))
    tapahtumaloki.onValue(setLahetykset)
  }

  useEffect(() => {
    setCount(undefined)
    setSending(false)
    fetchTapahtumaloki()
  }, [avustushaku.id, selvitysType])

  const valiselvitysSection = <div>
    <h4>Väliselvitysten lähettäminen</h4>
    <p>Väliselvitys tulee toimittaa viimeistään <strong>{avustushaku.valiselvitysdate}</strong>.</p>
    <p>Väliselvityspyynnöt lähetetään niille hakijoille, joiden hakemukset on hyväksytty ja jotka eivät ole vielä toimittaneet väliselvitystä.</p>
    <p data-test-id='valiselvitys-ohje' dangerouslySetInnerHTML={{__html: helpTexts["hakujen_hallinta__väliselvitys___ohje"]}} />
    <button data-test-id='send-valiselvitys' disabled={sending} onClick={onSendSelvitys}>Lähetä väliselvityspyynnöt</button>
    {count !== undefined && <span> Lähetetty {count} viestiä</span>}
    {!!lahetykset.length && <Tapahtumaloki lahetykset={lahetykset} />}
    <h1>Väliselvityslomake</h1>
  </div>

  const loppuSelvitysSection = <div>
    <h4>Loppuselvityksen lähettäminen</h4>
    <p>Loppuselvitys on koko ajan täytettävissä ja se tulee toimittaa viimeistään <strong>{avustushaku.loppuselvitysdate}</strong>.</p>
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
      <LastUpdated updatedAt={updatedAt} id={updatedAtElementId} />
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
        {parseError && <span className="error">{parseError}</span>}
        <div className="btn-fixed-container">
          <button className="btn-fixed" type="button" onClick={scrollToTop}>Takaisin ylös</button>
          <button id="saveForm" className="btn-fixed" type="button" onClick={onSaveForm} disabled={disableSave}>Tallenna</button>
        </div>
        <textarea onChange={onJsonChange} value={formDraftJson}/>
      </div>
    </div>
  )
}
