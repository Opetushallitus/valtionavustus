import _ from 'lodash'

export default class UrlCreator {
  constructor(props) {
    function defaultImpl() {
      throw new Error("Missing implementation")
    }

    this.formApiUrl = props.formApiUrl || defaultImpl
    this.newEntityApiUrl = props.newEntityApiUrl || defaultImpl
    this.editEntityApiUrl = props.editEntityApiUrl || defaultImpl
    this.loadEntityApiUrl= props.loadEntityApiUrl || defaultImpl

    this.existingSubmissionEditUrl = props.existingSubmissionEditUrl || defaultImpl
    this.existingSubmissionPreviewUrl = props.existingSubmissionPreviewUrl || defaultImpl

    this.attachmentBaseUrl = props.attachmentBaseUrl || defaultImpl
  }
}