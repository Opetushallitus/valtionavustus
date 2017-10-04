import React from "react"
import _ from "lodash"
import BusinessIdSearch from "./component/BusinessIdSearch.jsx"

export default class FormContainer extends React.Component {
  constructor(props){
    super(props)
     this.getOrganizationValues = this.getOrganizationValues.bind(this)
  }

  getOrganizationValues(id){
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

    const isBusinessIdSearchNeeded = this.props.showBusinessIdSearch && !isTestProfile && !isPreviewPage && ( ["organization", "organization-email", "business-id", "organization-postal-address"].map((item) => this.getOrganizationValues(item)).some(x => (x == "" || x == null)))

    return (
      <section id={containerId} >
        {headerElements}
        { (isBusinessIdSearchNeeded) &&
          <BusinessIdSearch state={this.props.state} controller={controller}/> }
        {formElement}
      </section>
    )
  }
}
