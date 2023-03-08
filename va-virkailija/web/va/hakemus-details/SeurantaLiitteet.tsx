import _ from 'lodash'
import React from 'react'
import Immutable from 'seamless-immutable'

import HelpTooltip from '../HelpTooltip'

import AttachmentField from 'soresu-form/web/form/component/AttachmentField'
import HttpUtil from 'soresu-form/web/HttpUtil'
import Translator from 'soresu-form/web/form/Translator'
import translationJson from '../../../../server/resources/public/translations.json'
import { HakuData } from '../types'
import { Avustushaku, Hakemus, Field } from 'soresu-form/web/va/types'
import { useHakemustenArviointiDispatch } from '../hakemustenArviointi/arviointiStore'
import { updateHakemukset } from '../hakemustenArviointi/arviointiReducer'

type SeurantaLiitteetProps = {
  hakemus: Hakemus
  hakuData: HakuData
  avustushaku: Avustushaku
  helpText: string
}

const SeurantaLiitteet = ({ hakemus, hakuData, avustushaku, helpText }: SeurantaLiitteetProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const hakemusId = hakemus.id
  const avustushakuId = avustushaku.id
  const hakemusUserKey = hakemus['user-key']
  const attachments = hakuData.attachments[hakemusId] || []
  const hakijaServer = _.get(hakuData, 'environment.hakija-server.url.fi')
  const fakeFormController = {
    componentDidMount: () => {},
  }
  const translations = Immutable(translationJson)
  const updateAttachments = () => dispatch(updateHakemukset({ avustushakuId }))

  const onDrop = (fieldId: string) => (files: any) => {
    const file = files[0]
    const formData = new FormData()
    formData.append('file', file)
    const url = `${hakijaServer}api/avustushaku/${avustushakuId}/hakemus/${hakemusUserKey}/${hakemus.version}/attachments/${fieldId}`
    HttpUtil.put(url, formData)
      .then(updateAttachments)
      .catch(function (error) {
        if (
          error.response &&
          error.response.status === 400 &&
          error.response.data &&
          error.response.data['detected-content-type']
        ) {
          const translator = new Translator(translationJson.errors)
          alert(
            translator.translate('attachment-has-illegal-content-type-error', 'fi', undefined, {
              'illegal-content-type': error.response.data['detected-content-type'],
            })
          )
        } else {
          console.error(`Error in adding attachment, PUT ${url}`, error)
        }
      })
  }

  const onRemove = (fieldId: string) => () => {
    const url = `${hakijaServer}api/avustushaku/${avustushakuId}/hakemus/${hakemusUserKey}/attachments/${fieldId}`
    HttpUtil.delete(url)
      .then(updateAttachments)
      .catch(function (error) {
        console.error(`Error in removing attachment, DELETE ${url}`, error)
      })
  }

  const makeDownloadUrl = (fieldId: string) =>
    `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/attachments/${fieldId}`

  const seurantaAttachmentsCount = _.keys(attachments).filter(
    (n) => n.indexOf('seuranta') >= 0
  ).length

  const fields = _.chain(seurantaAttachmentsCount + 1)
    .range()
    .map((id) =>
      Object.assign(
        {
          params: {},
          fieldClass: 'formField',
          helpText: {
            fi: '',
            sv: '',
          },
          label: {
            fi: 'Liite',
            sv: 'Liite',
          },
          required: true,
          fieldType: 'namedAttachment',
        },
        { id: `seuranta-${id}` }
      )
    )
    .value()

  return (
    <div className="seuranta-liitteet">
      <h2>
        Liitteet <HelpTooltip content={helpText} direction={'arviointi'} />
      </h2>
      {_.map(fields, (field: Field) => (
        <AttachmentField
          field={field}
          key={field.id}
          translationKey={field.id}
          translations={translations}
          lang="fi"
          disabled={false}
          allAttachments={attachments}
          onDrop={onDrop(field.id)}
          onRemove={onRemove(field.id)}
          htmlId={field.id}
          controller={fakeFormController}
          downloadUrl={makeDownloadUrl(field.id)}
          renderingParameters={{}}
        />
      ))}
    </div>
  )
}

export default SeurantaLiitteet
