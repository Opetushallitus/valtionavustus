import React from 'react'
import _ from 'lodash'
import FormPreview from './FormPreview.jsx'
import BusinessIdSearch from './component/BusinessIdSearch.jsx'


export default class FormContainer extends React.Component {
  constructor(props){
    super(props)
    this.getFieldValue = this.getFieldValue.bind(this)
    this.updateRefreshStatus = this.updateRefreshStatus.bind(this)
  }


  getFieldValue(id){
    const fieldValues = this.props.state.saveStatus.values.value
    if (fieldValues.find(x => x.key === id) != undefined){
      return fieldValues.filter(value => value.key == id)[0].value
    } else{
      return null
    }
  }

  updateRefreshStatus(){
    console.log("refreshed!")
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

    // Check if page is refressed and if in that case some values are missing.

    const conditions = (performance.navigation.type == 1) && ( ["organization", "organization-email", "business-id", "organization-postal-address"].map((item) => this.getFieldValue(item)).some(x => x == ""))


    return (
      <section id={containerId} onLoad={this.updateRefreshStatus}>
        {headerElements}
        {console.log(conditions2) }
        { (conditions) &&
          <BusinessIdSearch state={this.props.state} controller={controller}/> }
            {formElement}
          </section>
        )
      }
    }
