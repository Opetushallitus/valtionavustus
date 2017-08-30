import _ from 'lodash'
import React from 'react'

import AttachmentField from 'soresu-form/web/form/component/AttachmentField.jsx'
import HttpUtil from 'soresu-form/web/HttpUtil'

export default class SeurantaLiitteet extends React.Component {
  render() {
    const {controller, hakemus, hakuData, avustushaku, translations} = this.props
    const hakemusId = hakemus.id
    const avustushakuId = avustushaku.id
    const hakemusUserKey = hakemus["user-key"]
    const attachments = hakuData.attachments[hakemusId] || []
    const hakijaServer = _.get(hakuData,"environment.hakija-server.url.fi")
    const fakeFormController = {componentDidMount: () => {}}

    const onDrop = (fieldId, files) => {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      const url = `${hakijaServer}api/avustushaku/${avustushakuId}/hakemus/${hakemusUserKey}/${hakemus.version}/attachments/${fieldId}`
      HttpUtil.put(url, formData)
        .then(function(response) {
          controller.refreshAttachments(avustushakuId)
        })
        .catch(function(error) {
          console.error(`Error in adding attachment with drag'n'drop, PUT ${url}`, error)
          controller.saveError()
        })
    }

    const onRemove = fieldId => {
      const url = `${hakijaServer}api/avustushaku/${avustushakuId}/hakemus/${hakemusUserKey}/attachments/${fieldId}`
      HttpUtil.delete(url)
        .then(function(response) {
          controller.refreshAttachments(avustushakuId)
        })
        .catch(function(error) {
          console.error(`Error in removing attachment, DELETE ${url}`, error)
          controller.saveError()
        })
    }

    const makeDownloadUrl = fieldId =>
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/attachments/${fieldId}`

    const seurantaAttachmentsCount = _.keys(attachments).filter(n => n.indexOf("seuranta") >= 0).length

    const fields = _.chain(seurantaAttachmentsCount + 1)
      .range()
      .map(id => Object.assign(
        {
          params: {},
          fieldClass: "formField",
          helpText: {
            fi: "",
            sv: ""
          },
          label: {
            fi: "Liite",
            sv: "Liite"
          },
          required: true,
          fieldType: "namedAttachment"
        },
        {id: `seuranta-${id}`}
      ))
      .value()

    return (
      <div className="seuranta-liitteet">
        <h2>Liitteet</h2>
        {_.map(fields, field =>
          <AttachmentField field={field}
                           key={field.id}
                           translations={translations}
                           lang="fi"
                           disabled={false}
                           allAttachments={attachments}
                           onDrop={_.partial(onDrop, field.id)}
                           onRemove={_.partial(onRemove, field.id)}
                           htmlId={field.id}
                           controller={fakeFormController}
                           downloadUrl={makeDownloadUrl(field.id)} />
        )}
      </div>
    )
  }
}
