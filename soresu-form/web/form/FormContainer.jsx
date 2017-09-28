import React from "react"
import _ from "lodash"
import BusinessIdSearch from "./component/BusinessIdSearch.jsx"

export default class FormContainer extends React.Component {
  constructor(props){
    super(props)
     this.getFieldValue = this.getFieldValue.bind(this)
  }

  getFieldValue(id){
      if (this.props.state.configuration.preview) {
        return null
      }
      const fieldValues = this.props.state.saveStatus.values.value
      if (fieldValues.find(x => x.key === id) != undefined){
        return fieldValues.filter(value => value.key == id)[0].value
      }
      return null
    }

  render() {
    const {state, controller, formContainerClass} = this.props
    const headerElements = _.get(this.props, "headerElements", "")
    const containerId = _.get(this.props, "containerId", "container")
    const formElementProps = {
      controller: this.props.controller,
      state: state,
      infoElementValues: this.props.infoElementValues
    }
    const formElement = React.createElement(formContainerClass, formElementProps)

    const isTestProfile = this.props.state.configuration.develMode
    const isPreviewPage = this.props.state.saveStatus.savedObject === null
    const isAdminViewPage = this.props.state.configuration.preview === true
    const areEmptyFields =  !this.getFieldValue("organization") || !this.getFieldValue("organization-email") || !this.getFieldValue("business-id") || !this.getFieldValue("organization-postal-address")

    const fieldValue = this.props.state.saveStatus.values.value
    //const isOrganizationNull = fieldValue["organization"]

    // Check any of the values are missing, if so, show the modal
    const isBusinessIdSearchNeeded = !isPreviewPage && !isAdminViewPage && areEmptyFields


    return (
      <section id={containerId} >
        {headerElements}
        {console.log(areEmptyFields)}
        { (isBusinessIdSearchNeeded) &&
          <BusinessIdSearch state={this.props.state} controller={controller}/> }
        {formElement}
      </section>
    )
  }
}
