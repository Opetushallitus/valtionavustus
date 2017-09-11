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

    this.customStyle = {
        overlay : {
          position          : 'fixed',
          top               : 150,
          left              : 500,
          right             : 150,
          bottom            : 300,
          width             : 600,
          height            : 300,
          backgroundColor   : 'rgba(255, 255, 255, 0.75)'
        },
        content : {
          position                   : 'absolute',
          top                        : '40px',
          left                       : '40px',
          right                      : '40px',
          bottom                     : '40px',
          border                     : '1px solid #ccc',
          background                 : '#fff',
          overflow                   : 'auto',
          WebkitOverflowScrolling    : 'touch',
          borderRadius               : '4px',
          outline                    : 'none',
          padding                    : '20px'

        }
      }
  }

  openModal() {
  this.modalIsOpen = true
}

  afterOpenModal() {
  this.subtitle.style.color = '#f00';
}

  closeModal(id) {
  //handleclick with id
  handleclick(id)
  this.setState({modalIsOpen: false})
  console.log(this.props.state)
}

handleSubmitClick() {
  const name = this.myInput
  handleClick(name)
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
   console.log('A name was submitted: ' + this.input.value);
   this.handleClick(this.input.value)
   this.setState({modalIsOpen: false})
   //event.preventDefault();
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
         style={this.customStyle}
       >
       <h1>Aloita syöttämällä y-tunnus</h1>
       <p>Etc.</p>
         <div>
           <form onSubmit={this.handleSubmit}>
            <label>
              Y-tunnus:
              <input type="text" ref={(input) => this.input = input} />
            </label>
            <input type="submit" value="Hae" />
          </form>

        </div>

       </Modal>
     </div>)
   }
 }
