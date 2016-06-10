import Bacon from 'baconjs'
import React, {Component} from 'react'
import FakeFormController from '../form/FakeFormController.js'
import Form from 'soresu-form/web/form/Form.jsx'
import FormController from 'soresu-form/web/form/FormController.js'
import VaComponentFactory from 'va-common/web/va/VaComponentFactory'
import VaPreviewComponentFactory from 'va-common/web/va/VaPreviewComponentFactory'

import AttachmentField from 'soresu-form/web/form/component/AttachmentField.jsx'
import HttpUtil from 'va-common/web/HttpUtil'

export default class SeurantaLiitteet extends Component {

  render() {
    const {controller, hakemus, hakuData, avustushaku, translations} = this.props
    const hakemusId = hakemus.id
    const avustushakuId = avustushaku.id
    const hakemusUserKey = hakemus["user-key"]
    const attachments = hakuData.attachments[hakemusId] || []
    const field = {
      "id": "seuranta-0",
      "params": {},
      "fieldClass": "formField",
      "helpText": {
        "fi": "",
        "sv": ""
      },
      "label": {
        "fi": "Liite",
        "sv": "Liite"
      },
      "required": true,
      "fieldType": "namedAttachment"
    }
    const formController = new FakeFormController(new VaComponentFactory(), new VaPreviewComponentFactory(), avustushaku, hakemus)
    const hakijaServer = _.get(hakuData,"environment.hakija-server.url.fi")

    const onDrop = (field,files)=> {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      HttpUtil.put(`${hakijaServer}api/avustushaku/${avustushakuId}/hakemus/${hakemusUserKey}/${hakemus.version}/attachments/${field.id}`, formData)
        .then(function(response) {
          controller.refreshAttachments(avustushakuId)
        })
        .catch(function(error) {
          console.error(error)
          controller.saveError()
        })

    }

    const onRemove = (field)=> {
      const url = `${hakijaServer}api/avustushaku/${avustushakuId}/hakemus/${hakemusUserKey}/attachments/${field.id}`
      HttpUtil.delete(url)
        .then(function(response) {
          controller.refreshAttachments(avustushakuId)
        })
        .catch(function(error) {
          console.error(error)
          controller.saveError()
        })
    }

    const seurantaAttachmentCount = _.keys(attachments).filter((n)=>n.indexOf("seuranta")!=-1).length
    const ids = _.range(seurantaAttachmentCount + 1)
    const fields = ids.map((id)=>Object.assign({},field,{id:`seuranta-${id}`}))
    const downloadUrl = `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/attachments/${field.id}`

    return (
      <div className="seuranta-liitteet">
        <h2 className="heading">Liitteet</h2>
            {fields.map(field=>{
                return <AttachmentField field={field}
                                        key={field.id}
                                 translations={translations}
                                 lang="fi"
                                 disabled={false}
                                 allAttachments={attachments}
                                 onDrop={_.partial(onDrop,field)}
                                 onRemove={_.partial(onRemove,field)}
                                 htmlId={field.id}
                                 controller={formController}
                                 downloadUrl={downloadUrl}

                />
            }
            )}

      </div>
    )
  }
}
