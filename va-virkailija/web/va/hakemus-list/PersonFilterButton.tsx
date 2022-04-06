import React, { useState } from 'react'

import { HakemusFilter, Role, State } from '../types'
import HakemustenArviointiController from '../HakemustenArviointiController'


type RoleButtonProps = {
  roleField: 'evaluator' | 'presenter'
  role: Role
  controller: HakemustenArviointiController
  hakemusFilter: HakemusFilter
}

const RoleButton = ({ role, roleField, controller, hakemusFilter }: RoleButtonProps) => {
  const currentFilter = hakemusFilter[roleField]
  const onClick = () => {
    const newFilter = currentFilter === role.id ? undefined : role.id
    controller.setFilter(roleField,newFilter)
    controller.closeHakemusDetail()
  }
  const active = role.id === currentFilter

  return (
    <button className={`btn btn-sm ${active ? 'btn-selected' : 'btn-simple'}`} onClick={onClick}>{role.name}</button>
  )
}

type RoleContainerProps = {
  roleName: string
  roleField: 'evaluator' | 'presenter'
  roles: Role[]
  controller: HakemustenArviointiController
  hakemusFilter: HakemusFilter
}

const RoleContainer = ({roleName,roleField,roles,controller,hakemusFilter}: RoleContainerProps) => {
  return (
    <React.Fragment>
      <div className="role-title">{roleName}</div>
      <div className="role-container">
        {roles.map(role => <RoleButton key={`${roleName}-${role.id}`} role={role} roleField={roleField} controller={controller} hakemusFilter={hakemusFilter}/>)}
      </div>
    </React.Fragment>
  )
}

const PersonSelectPanel = ({ state, controller, setIsOpen }: PersonFilterButtonProps & { setIsOpen: (isOpen: boolean) => void }) =>{
  const hakemusFilter = state.hakemusFilter
  const roles = [...state.hakuData.roles].sort((a, b) => a.name > b.name ? -1 : 1)
  const presenters = roles.filter(r => ["presenting_officer", "vastuuvalmistelija"].includes(r.role))

  return (
    <div className="panel person-panel">
      <button className="close" onClick={() => setIsOpen(false)}>x</button>
      <RoleContainer roleName="Valmistelija" roleField="presenter" roles={presenters} controller={controller} hakemusFilter={hakemusFilter}/>
      <RoleContainer roleName="Arvioija" roleField="evaluator" roles={roles} controller={controller} hakemusFilter={hakemusFilter}/>
    </div>
  )
}

type PersonFilterButtonProps = {
  controller: HakemustenArviointiController
  state: State
}

export const PersonFilterButton = ({ state, controller }: PersonFilterButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hakemusFilter = state.hakemusFilter
  const activeFilterCount = (hakemusFilter.evaluator ? 1 : 0) + (hakemusFilter.presenter ? 1 : 0)
  const onClick = () => {
    controller.togglePersonSelect(undefined)
    setIsOpen(!isOpen)
  }

  return (
    <div className="person-filter-button">
      <button onClick={onClick} className={`btn btn-sm btn-simple btn-role ${activeFilterCount ? 'btn-selected--border' : 'btn-role--center'}`}>
        <span hidden={!activeFilterCount} className="btn-role__count">
          {activeFilterCount}
        </span>
      </button>
      {isOpen && <PersonSelectPanel state={state} controller={controller} setIsOpen={setIsOpen} />}
    </div>
  )
}
