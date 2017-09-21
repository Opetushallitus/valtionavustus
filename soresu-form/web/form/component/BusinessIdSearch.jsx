import React from "react"
import Modal from "react-modal"
import FormUtil from "../FormUtil.js"
import LocalizedString from "./LocalizedString.jsx"
import Translator from "../Translator.js"
import HttpUtil from "../../HttpUtil.js"


export default class BusinessIdSearch extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.changeFieldValue = this.changeFieldValue.bind(this)
    this.openModal = this.openModal.bind(this)
    this.afterOpenModal = this.afterOpenModal.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.handleOnChange = this.handleOnChange.bind(this)
    this.handleOnSubmit = this.handleOnSubmit.bind(this)
    this.validate = this.validate.bind(this)
    this.state = {
      modalIsOpen: true,
      typed: "",
      isDisabled: true,
      error: "error",
      incorrectBusinessId: false,
      otherErrorOnBusinessId: false,
      businessId: "",
      mappedFieldNames : {
        "organization": "name",
        "organization-email": "email",
        "business-id": "organisation-id",
        "organization-postal-address" : "contact"
      }
    }
    this.lang = this.props.state.configuration.lang
    this.translations = this.props.state.configuration.translations.misc
    this.translator = new Translator(this.props.state.configuration.translations.misc)

  }



  openModal() {
    this.setState({modalIsOpen: true})
  }

  afterOpenModal() {
    this.subtitle.style.color = "#f00"
  }

  closeModal() {
    this.setState({modalIsOpen: false})
  }


  changeFieldValue(data, fieldName, dataField){
    if (dataField != "contact") {
      this.props.controller.componentOnChangeListener(FormUtil.findField(this.props.state, fieldName), data[dataField])
    } else {
      const address = data.contact.address + " " + data.contact["postal-number"] + " " + data.contact.city
      this.props.controller.componentOnChangeListener(FormUtil.findField(this.props.state, fieldName), address)
    }
  }

  // events from inputting the organisational id (y-tunnus)
  handleOnSubmit() {
    this.handleClick(this.state.businessId)
    this.setState({modalIsOpen: false})
  }


  handleOnChange(event) {
    const inputted = event.target.value
    this.validate(inputted)
    this.setState({typed: inputted})
    this.setState({businessId: inputted})
  }

  //validate input of business-id
  validate(inputted){
    const text = inputted
    const businessIdMatch = /^\d{7}-\d$/
    if (text.match(businessIdMatch)) {
      this.setState({isDisabled: false})
      this.setState({error: ""})
    }else {
      this.setState({isDisabled: true})
    }
  }

  // actions that happen after user has submitted their organisation-id, calls backend organisaton api
  handleClick(id) {
    const language = this.props.state.configuration.lang
    const url = this.props.controller.createOrganisationInfoUrl(this.props.state)

    HttpUtil.get(url + id + "&lang=" + language).then(
      response   => {
        Object.keys(this.state.mappedFieldNames).forEach(key =>   this.changeFieldValue(response, key, this.state.mappedFieldNames[key]))
      }).catch(error => {
      if (error.response.status == 404){
        this.setState({incorrectBusinessId: true})
        this.openModal()
      }else {
        this.setState({otherErrorOnBusinessId: true})
        this.setState({incorrectBusinessId: false})
        this.openModal()
      }})}


  render() {

    return (

      <div>
        <Modal
          isOpen={this.state.modalIsOpen}
          contentLabel="modal"
          className="modal"
          overlayClassName="overlay"
        >
          <div>
            <h1><LocalizedString translations={this.translations} translationKey="give-businessid" lang={this.lang}/></h1>
            <p><LocalizedString translations={this.translations} translationKey="organisation-info" lang={this.lang}/></p>
            <p id="not-found-business-id">{this.state.incorrectBusinessId && <LocalizedString translations={this.translations} translationKey="not-found-business-id" lang={this.lang}/>}</p>
            <p id="other-error-business-id">{this.state.otherErrorOnBusinessId && <LocalizedString translations={this.translations} translationKey="error-with-business-id" lang={this.lang}/>}</p>
            <form onSubmit={this.handleOnSubmit}>
              <label className="modal-label">
                <LocalizedString translations={this.translations} translationKey="business-id" lang={this.lang}/> :
                <input className={this.state.error} type="text" value={this.state.businessId} onChange={ this.handleOnChange } />
              </label>
              <input className={"get-business-id" + " " + "soresu-text-button"} type="submit" value={this.translator.translate("get", this.lang)} disabled={this.state.isDisabled} />
            </form>
            <p><a href="#" onClick={this.closeModal}><LocalizedString translations={this.translations} translationKey="cancel" lang={this.lang}/></a></p>
          </div>
        </Modal>
      </div>)
  }
}
