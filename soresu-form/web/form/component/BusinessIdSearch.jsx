import React from 'react'
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import FormController from '../FormController.js'
import FormUtil from '../FormUtil.js'
import LocalizedString from './LocalizedString.jsx'
import Translator from '../Translator.js'
import HttpUtil from '../../HttpUtil.js'
import VaUrlCreator from '../../../../va-hakija/web/va/VaUrlCreator.js'


export default class BusinessIdSearch extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.changeFieldValue = this.changeFieldValue.bind(this)
    this.openModal = this.openModal.bind(this)
    this.afterOpenModal = this.afterOpenModal.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.validate = this.validate.bind(this)
    this.state = {
      modalIsOpen: true,
      typed: '',
      isDisabled: true,
      error: "error"
    }
    this.lang = this.props.state.configuration.lang
    this.translations = this.props.state.configuration.translations.misc
  }

  openModal() {
    this.setState({modalIsOpen: true})
  }

  afterOpenModal() {
    this.subtitle.style.color = '#f00';
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
  handleSubmit(event) {
    this.handleClick(this.input.value)
    this.setState({modalIsOpen: false})
  }


  handleChange(event) {
    var inputted = event.target.value
    this.setState({typed: inputted})
    this.validate(inputted)
  }

  //validate input of business-id
  validate(inputted){
    const text = inputted
    if (text.match(/^\d{7}-\d$/)) {
      this.setState({isDisabled: false})
      this.setState({error: ""})
    }
  }

  // actions that happen after user has submitted their organisation-id, calls backend organisaton api
  handleClick(id) {
    const businessIdField = this.props.state.saveStatus.values.value.filter(value => value.key == "business-id")
    const language = this.props.state.configuration.lang
    const url = this.props.controller.createOrganisationInfoUrl(this.props.state)
    HttpUtil.get(url + id + "&lang=" + language).then(
      response   => {
        const fieldNames = ["organization", "organization-email", "business-id", "organization-postal-address"]
        const dataFieldNames = ["name", "email",  "organisation-id", "contact"]
        fieldNames.map((item, key) => this.changeFieldValue(response, item, dataFieldNames[key]))})
      }


      render() {
        const translator = new Translator(this.translations)
        return (

          <div>
            <Modal
              isOpen={this.state.modalIsOpen}
              onRequestClose={this.closeModal}
              contentLabel="Modal"
              className="Modal"
              overlayClassName="Overlay"
              >
              <div>
                <h1><LocalizedString translations={this.translations} translationKey="give-businessid" lang={this.lang}/></h1>
                <p><LocalizedString translations={this.translations} translationKey="organisation-info" lang={this.lang}/></p>
                <form onSubmit={this.handleSubmit}>
                  <label className="ModalLabel">
                    <LocalizedString translations={this.translations} translationKey="business-id" lang={this.lang}/> :
                      <input className={this.state.error} type="text" ref={(input) => this.input = input} onChange={ this.handleChange } />
                    </label>
                    <input className={"get-business-id" + " " + "soresu-text-button"} type="submit" value={translator.translate("get", this.lang)} disabled={this.state.isDisabled} />
                  </form>
                  <p><a href="#" onClick={this.closeModal}><LocalizedString translations={this.translations} translationKey="cancel" lang={this.lang}/></a></p>
                </div>
              </Modal>
            </div>)
          }
        }
