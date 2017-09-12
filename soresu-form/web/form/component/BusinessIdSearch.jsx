import React from 'react'
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import axios from 'axios'
import FormController from '../FormController.js'
import FormUtil from '../FormUtil.js'


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
        console.log(dataFieldNames[3])
        console.log(fieldNames[3])

        fieldNames.map((item, key) => this.changeFieldValue(data, item, dataFieldNames[key]))
     })
   }

   render() {
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
           <h1>Aloita syöttämällä y-tunnus</h1>
           <p>Tiedot haetaan organisaatiopalvelusta</p>
           <form onSubmit={this.handleSubmit}>
            <label className="ModalLabel">
              Y-tunnus:
              <input className="soresu-text-field" type="text" ref={(input) => this.input = input} />
            </label>
            <input className="soresu-text-button" type="submit" value="Hae" />
          </form>
          <p><a href="#" onClick={this.closeModal}> Peruuta</a></p>
        </div>
       </Modal>
     </div>)
   }
 }
