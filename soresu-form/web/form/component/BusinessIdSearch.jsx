import React from 'react'
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import axios from 'axios'
import FormController from '../FormController.js'
import FormUtil from '../FormUtil.js'
import LocalizedString from './LocalizedString.jsx'
import Translator from '../Translator.js'


export default class BusinessIdSearch extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.changeFieldValue = this.changeFieldValue.bind(this)
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this)
    this.state = {
        modalIsOpen: true
      }
    this.lang = this.props.state.configuration.lang
    this.translations = this.props.state.configuration.translations.misc
  }

  openModal() {
  this.modalIsOpen = true
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

  handleSubmit(event) {
   this.handleClick(this.input.value)
   this.setState({modalIsOpen: false})
 }

  handleClick(id) {
      const businessIdField = this.props.state.saveStatus.values.value.filter(value => value.key == "business-id")
      const language = this.props.state.configuration.lang

      axios.get("http://localhost:8080/api/organisations/?organisation-id=" + id + "&lang=" + language ).then(({ data })=> {
        const fieldNames = ["organization", "organization-email", "business-id", "organization-postal-address"]
        const dataFieldNames = ["name", "email",  "organisation-id", "contact"]

        fieldNames.map((item, key) => this.changeFieldValue(data, item, dataFieldNames[key]))
     })
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
              <input className="soresu-text-field" type="text" ref={(input) => this.input = input} />
            </label>
            <input className="soresu-text-button" type="submit" value={translator.translate("get", this.lang)} />
          </form>
          <p><a href="#" onClick={this.closeModal}><LocalizedString translations={this.translations} translationKey="cancel" lang={this.lang}/></a></p>
        </div>
       </Modal>
     </div>)
   }
 }
