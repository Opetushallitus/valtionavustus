import React, { Component } from 'react'

export default class FakeFormController {

  constructor(customPreviewComponentFactory, avustushaku, hakemus) {
    this.customPreviewComponentFactory = customPreviewComponentFactory
    this.avustushaku = avustushaku
    this.hakemus = hakemus
  }

  constructHtmlId(fields, fieldId) {
    return fieldId
  }

  getCustomComponentProperties() {
    return this.avustushaku
  }

  getCustomPreviewComponentTypeMapping() {
    return this.customPreviewComponentFactory.fieldTypeMapping
  }

  createCustomPreviewComponent(componentProps) {
    return this.customPreviewComponentFactory.createComponent(componentProps)
  }

  getCustomComponentProperties(state) {
    return { "avustushaku": this.avustushaku }
  }

  createAttachmentDownloadUrl(state, field) {
    return "/api/avustushaku/" + this.avustushaku.id + "/hakemus/" + this.hakemus.id + "/attachments/" + field.id
  }
}
