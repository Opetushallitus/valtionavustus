import React, { ChangeEvent, useEffect, useState } from 'react'
import { isEqual } from 'lodash'
import * as Bacon from 'baconjs'
import moment from 'moment'

import * as styles from './SelvitysFormEditor.module.css'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { fiShortFormat } from 'soresu-form/web/va/i18n/dateformat'
import { Avustushaku, Form } from 'soresu-form/web/va/types'

import FormEditor from './FormEditor'
import { Lahetys, Tapahtumaloki } from './Tapahtumaloki'
import { LastUpdated } from './LastUpdated'
import { useHakujenHallintaDispatch, useHakujenHallintaSelector } from '../hakujenHallintaStore'
import {
  selectHakuState,
  selectLoadedInitialData,
  recreateSelvitysForm,
  saveSelvitysForm,
  selvitysFormJsonUpdated,
  selvitysFormUpdated,
} from '../hakuReducer'
import { tryToUseCurrentAvustushaku, useCurrentAvustushaku } from '../useAvustushaku'
import ChooseAvustushaku from './ChooseAvustushaku'

type SelvitysFormEditorProps = {
  selvitysType: 'valiselvitys' | 'loppuselvitys'
}

const SelvitysFormEditorPage = ({ selvitysType }: SelvitysFormEditorProps) => {
  const avustushaku = useCurrentAvustushaku()
  const isValiSelvitys = selvitysType === 'valiselvitys'
  const { environment, helpTexts } = useHakujenHallintaSelector(selectLoadedInitialData)
  const { koodistos } = useHakujenHallintaSelector(selectHakuState)
  const loading = useHakujenHallintaSelector(
    (state) =>
      state.haku.loadStatus.loadingAvustushaku === true || state.haku.loadingProjects === true
  )
  const valiselvitysFormDraft = useHakujenHallintaSelector(
    (state) => state.haku.valiselvitysFormDrafts[avustushaku.id]
  )
  const valiselvitysFormDraftJson = useHakujenHallintaSelector(
    (state) => state.haku.valiselvitysFormDraftsJson[avustushaku.id]
  )
  const loppuselvitysFormDraft = useHakujenHallintaSelector(
    (state) => state.haku.loppuselvitysFormDrafts[avustushaku.id]
  )
  const loppuselvitysFormDraftsJson = useHakujenHallintaSelector(
    (state) => state.haku.loppuselvitysFormDraftsJson[avustushaku.id]
  )
  const [count, setCount] = useState<number | undefined>(undefined)
  const [sending, setSending] = useState(false)
  const [lahetykset, setLahetykset] = useState<Lahetys[]>([])
  const dispatch = useHakujenHallintaDispatch()
  const formContent =
    selvitysType === 'valiselvitys' ? avustushaku.valiselvitysForm : avustushaku.loppuselvitysForm
  const updatedAtElementId = `${selvitysType}UpdatedAt`
  const updatedAt = formContent?.updated_at
  const formDraft = isValiSelvitys ? valiselvitysFormDraft : loppuselvitysFormDraft
  const formDraftJson = isValiSelvitys ? valiselvitysFormDraftJson : loppuselvitysFormDraftsJson
  const previewUrlFi =
    environment['hakija-server'].url.fi +
    'avustushaku/' +
    avustushaku.id +
    '/' +
    selvitysType +
    '/esikatselu'
  const previewUrlSv =
    environment['hakija-server'].url.sv +
    'avustushaku/' +
    avustushaku.id +
    '/' +
    selvitysType +
    '/esikatselu' +
    '?lang=sv'
  const onFormChange = ({ id }: Avustushaku, newDraft: Form) => {
    dispatch(selvitysFormUpdated({ selvitysType, newDraft, avustushakuId: id }))
    dispatch(
      selvitysFormJsonUpdated({
        selvitysType,
        newDraftJson: JSON.stringify(newDraft, null, 2),
        avustushakuId: id,
      })
    )
  }

  const onJsonChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(
      selvitysFormJsonUpdated({
        selvitysType,
        avustushakuId: avustushaku.id,
        newDraftJson: e.target.value,
      })
    )
    try {
      const parsedDraft = JSON.parse(e.target.value)
      dispatch(
        selvitysFormUpdated({
          avustushakuId: avustushaku.id,
          selvitysType,
          newDraft: parsedDraft,
        })
      )
    } catch (err) {}
  }

  const onSaveForm = () => {
    dispatch(
      saveSelvitysForm({
        avustushakuId: avustushaku.id,
        form: formDraft,
        selvitysType,
      })
    )
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
    return formDraft && formContent && !isEqual(parsedForm, formContent)
  }

  const hasFormBeenEdited = !formHasBeenEdited()
  const disableSave = !!parseError || hasFormBeenEdited
  const recreateForm = () => {
    dispatch(recreateSelvitysForm({ avustushaku, selvitysType }))
  }

  const onSendSelvitys = () => {
    setSending(true)
    HttpUtil.post(
      `/api/avustushaku/${avustushaku.id}/selvitys/${selvitysType}/send-notification`
    ).then((response) => {
      setCount(response.count)
      setSending(false)
      fetchTapahtumaloki()
    })
  }

  const fetchTapahtumaloki = () => {
    setLahetykset([])
    const tapahtumaloki = Bacon.fromPromise<Lahetys[]>(
      HttpUtil.get(`/api/avustushaku/${avustushaku.id}/tapahtumaloki/${selvitysType}-notification`)
    )
    tapahtumaloki.onValue(setLahetykset)
  }

  useEffect(() => {
    setCount(undefined)
    setSending(false)
    fetchTapahtumaloki()
  }, [avustushaku.id, selvitysType])
  const noSelvitysSent = (
    <h4 data-test-id={'selvityspyynto-not-sent'} className={styles.selvityspyyntoNotSent}>
      Selvityspyyntöjä ei ole lähetetty
    </h4>
  )
  const valiselvitysSection = (
    <div>
      <h4>Väliselvitysten lähettäminen</h4>
      {avustushaku.loppuselvitysdate ? (
        <p>
          Väliselvitys tulee toimittaa viimeistään{' '}
          <strong>{moment(avustushaku.valiselvitysdate).format(fiShortFormat)}</strong>.
        </p>
      ) : (
        <p>Väliselvityksen toimitukselle ei ole asetettu takarajaa.</p>
      )}
      <p>
        Väliselvityspyynnöt lähetetään niille hakijoille, joiden hakemukset on hyväksytty ja jotka
        eivät ole vielä toimittaneet väliselvitystä.
      </p>
      <p
        data-test-id="valiselvitys-ohje"
        dangerouslySetInnerHTML={{
          __html: helpTexts['hakujen_hallinta__väliselvitys___ohje'],
        }}
      />
      <button
        data-test-id="send-valiselvitys"
        disabled={loading || sending}
        onClick={onSendSelvitys}
      >
        Lähetä väliselvityspyynnöt
      </button>
      {count !== undefined && <span> Lähetetty {count} viestiä</span>}
      {!!lahetykset.length ? <Tapahtumaloki lahetykset={lahetykset} /> : noSelvitysSent}
      <h1>Väliselvityslomake</h1>
    </div>
  )

  const loppuSelvitysSection = (
    <div>
      <h4>Loppuselvityksen lähettäminen</h4>
      {avustushaku.loppuselvitysdate ? (
        <p>
          Loppuselvitys on koko ajan täytettävissä ja se tulee toimittaa viimeistään{' '}
          <strong>{moment(avustushaku.loppuselvitysdate).format(fiShortFormat)}</strong>.
        </p>
      ) : (
        <p>Loppuselvityksen toimitukselle ei ole asetettu takarajaa.</p>
      )}
      <p>
        Loppuselvityspyynnöt lähetetään niille hakijoille, joiden hakemukset on hyväksytty ja jotka
        eivät ole vielä toimittaneet loppuselvitystä.
      </p>
      <p
        data-test-id="loppuselvitys-ohje"
        dangerouslySetInnerHTML={{
          __html: helpTexts['hakujen_hallinta__loppuselvitys___ohje'],
        }}
      />
      <button
        data-test-id="send-loppuselvitys"
        disabled={loading || sending}
        onClick={onSendSelvitys}
      >
        Lähetä loppuselvityspyynnöt
      </button>
      {count !== undefined && <span> Lähetetty {count} viestiä</span>}
      {!!lahetykset.length ? <Tapahtumaloki lahetykset={lahetykset} /> : noSelvitysSent}
      <h1>Loppuselvityslomake</h1>
    </div>
  )

  return (
    <div>
      {selvitysType === 'valiselvitys' ? valiselvitysSection : loppuSelvitysSection}
      <button style={{ float: 'right' }} onClick={recreateForm}>
        Palauta alkuperäiset kysymykset
      </button>
      <LastUpdated updatedAt={updatedAt} id={updatedAtElementId} />
      <div className="link-list">
        <div className="link-list-item">
          <h3>Lomakkeen esikatselu</h3>
          <a
            target="_blank"
            data-test-id="form-preview-fi"
            rel="noopener noreferrer"
            href={previewUrlFi}
          >
            Suomeksi
          </a>
          <span className="link-divider" />
          <a
            target="_blank"
            data-test-id="form-preview-sv"
            rel="noopener noreferrer"
            href={previewUrlSv}
          >
            Ruotsiksi
          </a>
        </div>
      </div>
      <FormEditor
        avustushaku={avustushaku}
        formDraft={formDraft}
        koodistos={koodistos}
        onFormChange={onFormChange}
      />
      <div className="form-json-editor">
        <h3>Hakulomakkeen sisältö</h3>
        {parseError && <span className="error">{parseError}</span>}
        <div className="btn-fixed-container">
          <button className="btn-fixed" type="button" onClick={scrollToTop}>
            Takaisin ylös
          </button>
          <button
            id="saveForm"
            className="btn-fixed"
            type="button"
            onClick={onSaveForm}
            disabled={disableSave}
          >
            Tallenna
          </button>
        </div>
        <textarea onChange={onJsonChange} value={formDraftJson} />
      </div>
    </div>
  )
}

export const SelvitysFormEditor = (props: SelvitysFormEditorProps) => {
  const avustushaku = tryToUseCurrentAvustushaku()
  if (!avustushaku) {
    return <ChooseAvustushaku />
  }
  return <SelvitysFormEditorPage selvitysType={props.selvitysType} />
}
