import _ from 'lodash'

export default class UrlCreator {
  constructor(props) {
    function defaultImpl() {
      throw new Error("Missing implementation")
    }

    this.formApiUrl = props.formApiUrl || defaultImpl
    this.avustusHakuApiUrl = props.avustusHakuApiUrl || defaultImpl
    this.newHakemusApiUrl = props.newHakemusApiUrl || defaultImpl
    this.existingHakemusApiUrl = props.existingHakemusApiUrl || defaultImpl

    this.existingHakemusEditUrl = props.existingHakemusEditUrl || defaultImpl
    this.existingHakemusPreviewUrl = props.existingHakemusPreviewUrl || defaultImpl
  }
}