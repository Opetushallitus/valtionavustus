import React from "react"
import _ from "lodash"
import BusinessIdSearch from "./component/BusinessIdSearch.jsx"

export default class FormContainer extends React.Component {
  constructor(props){
    super(props)
     this.getOrganizationValue = this.getOrganizationValue.bind(this)
  }

  getOrganizationValue(id) {
    if (this.props.state.configuration.preview) {
      return null
    }
    const fieldValues = this.props.state.saveStatus.values.value
    const value = _.find(fieldValues, x => x.key === id)
    return value !== undefined
      ? value.value
      : null
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
    const isRefreshed = performance.navigation.type == 1
    const isValiselvitys = this.props.hakemusType == "valiselvitys"
    const isLoppuselvitys = this.props.hakemusType == "loppuselvitys"

    const conditions = !isTestProfile && !isAdminViewPage && !isValiselvitys && !isLoppuselvitys && (!isPreviewPage && ((this.props.state.saveStatus.savedObject.version == 1) || (isRefreshed && ( ["organization", "organization-email", "business-id", "organization-postal-address"].map((item) => this.getOrganizationValue(item)).some(x => (x == "" || x == null))))))



    return (
      <section id={containerId} >
        {headerElements}
        { (conditions) &&
          <BusinessIdSearch state={this.props.state} controller={controller}/> }
        {formElement}
      </section>
    )
  }
}
