import React from 'react'

import { OrganisationSelection } from './component/OrganisationSelection'

type FormContainerProps = {
  state: any
  controller: any
  form: any
  useBusinessIdSearch?: boolean
  headerElements?: React.ReactNode
  containerId?: string
  infoElementValues?: any
  modifyApplication?: string
  hakemusType?: string
}

export default function FormContainer(props: FormContainerProps) {
  const { state, controller, form, useBusinessIdSearch, infoElementValues, modifyApplication } =
    props
  const headerElements = props.headerElements || ''
  const containerId = props.containerId || 'container'

  const formElementProps = {
    controller,
    state,
    infoElementValues: infoElementValues,
    modifyApplication: modifyApplication,
  }
  const formElement = React.createElement(form, formElementProps)
  const { embedForMuutoshakemus } = state.configuration

  if (embedForMuutoshakemus) {
    return (
      <section id={containerId} style={{ marginTop: '0px' }}>
        {formElement}
      </section>
    )
  } else {
    return (
      <section id={containerId}>
        {headerElements}
        {useBusinessIdSearch && <OrganisationSelection state={state} controller={controller} />}
        {formElement}
      </section>
    )
  }
}
