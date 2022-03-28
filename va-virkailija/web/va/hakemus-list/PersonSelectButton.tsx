import React from 'react'

import { Hakemus } from 'soresu-form/web/va/types'

import { Role, RoleType, State } from '../types'
import HakemustenArviointiController from '../HakemustenArviointiController'

type RoleButtonProps = {
  role: Role
  roleField: 'evaluators' | 'presenter'
  controller: HakemustenArviointiController
  hakemus: Hakemus
}

const RoleButton = ({ role, roleField, controller, hakemus }: RoleButtonProps) => {
  const onClick = () => controller.toggleHakemusRole(role.id, hakemus, roleField)
  const currentRoles = hakemus.arvio.roles[roleField]
  const active = roleField === "presenter" ? hakemus.arvio["presenter-role-id"] === role.id : currentRoles.includes(role.id)

  return (
    <button className={`btn btn-sm ${active ? 'btn-selected' : 'btn-simple'}`} onClick={onClick}>{role.name}</button>
  )
}

type RoleContainerProps = {
  roleName: string
  roleField: 'evaluators' | 'presenter'
  roles: Role[]
  controller: HakemustenArviointiController
  hakemus: Hakemus
}

const RoleContainer = ({ roleName, roleField, roles, controller, hakemus }: RoleContainerProps) => {
  return (
    <React.Fragment>
      <div className="role-title">{roleName}</div>
      <div className="role-container">
        {roles.map(role => <RoleButton key={role.id} role={role} roleField={roleField} controller={controller} hakemus={hakemus}/>)}
      </div>
    </React.Fragment>
  )
}

type PersonSelectButtonProps = {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  state: State
}

const PersonSelectPanel = ({ hakemus, state, controller }: PersonSelectButtonProps) => {
  const roles = state.hakuData.roles
  const filterByRole = (filteredRoles: RoleType[]) => roles.filter(currentRole => filteredRoles.includes(currentRole.role)).sort((a, b) => a.name > b.name ? -1 : 1)
  const presenters = filterByRole(["presenting_officer", "vastuuvalmistelija"])
  const evaluators = filterByRole(["evaluator"])
  const onCloseClick = () => controller.togglePersonSelect(undefined)
  return (
    <div className="panel person-panel person-panel--top">
      <button className="close" onClick={onCloseClick} data-test-id="close-person-select-panel">x</button>
      <RoleContainer roleName="Valmistelija" roleField="presenter" roles={presenters} controller={controller} hakemus={hakemus}/>
      <RoleContainer roleName="Arvioijat" roleField="evaluators" roles={evaluators} controller={controller} hakemus={hakemus}/>
    </div>
  )
}

export const PersonSelectButton = ({ controller, hakemus, state }: PersonSelectButtonProps) => {
  const onClick = () => {
    controller.togglePersonSelect(hakemus.id)
    document.body.classList.add('split-view')
  }
  const roles = state.hakuData.roles.map(r => r.id)
  const presenterRoleId = hakemus.arvio["presenter-role-id"]
  const personCount = hakemus.arvio.roles.evaluators.filter(id => roles.includes(id)).length + (presenterRoleId && roles.includes(presenterRoleId) ? 1 : 0)
  const countIndicator = personCount || "+"
  const presenter = state.hakuData.roles.find(r => r.id === presenterRoleId)
  const presenterName = presenter?.name ?? ""

  return(
    <div>
      <button onClick={onClick} className="btn btn-sm btn-simple btn-role" title={presenterName}>
        <span className="btn-role__count">{countIndicator}</span>
      </button>
      {state.personSelectHakemusId === hakemus.id
        ? <PersonSelectPanel hakemus={hakemus} state={state} controller={controller}/>
        : <span/>
      }
    </div>
  )
}
