import ClassNames from 'classnames'
import React from 'react'
import _ from 'lodash'

const RoleButton = ({role,roleField,controller,hakemusFilter}) => {
  const currentFilter = hakemusFilter[roleField]
  const onClick = (roleId) =>{
    const newFilter = currentFilter==roleId ? undefined : roleId
    controller.setFilter(roleField,newFilter)
    controller.closeHakemusDetail()
  }
  const active = role.id==currentFilter
  const buttonClass = ClassNames('btn btn-sm',{
    'btn-selected': active,
    'btn-simple': !active
  })
  return (
    <button className={buttonClass} onClick={onClick.bind(this,role.id)}>{role.name}</button>
  )
}

const RoleContainer = ({roleName,roleField,roles,controller,hakemusFilter}) => {
  return(
    <div className="role-container">
      <div className="text-grey role-title">{roleName}</div>
      {roles.map((role)=>(<RoleButton key={role.id} role={role} roleField={roleField} controller={controller} hakemusFilter={hakemusFilter}/>))}
    </div>
  )
}

const PersonSelectPanel = ({state,controller,hakemusFilter}) =>{
  const show = hakemusFilter.roleIsOpen
  const roles = state.hakuData.roles
  const filterByRole = (roles,role)=> _.sortBy(roles.filter((currentRole)=>currentRole.role==role),'name')
  const presenters = filterByRole(roles,"presenting_officer")
  const evaluators = filterByRole(roles,"evaluator")
  const onCloseClick = () => {
    controller.setFilter("roleIsOpen",false)
  }

  return (
    <div hidden={!show} className="panel person-panel">
      <button className="close" onClick={onCloseClick}>x</button>
      <RoleContainer roleName="Esittelijä" roleField="presenter" roles={presenters} controller={controller} hakemusFilter={hakemusFilter}/>
      <RoleContainer roleName="Arvioija" roleField="evaluator" roles={evaluators} controller={controller} hakemusFilter={hakemusFilter}/>
    </div>
  )
}

const PersonFilterButton = ({state,controller}) => {
  const hakemusFilter = state.hakemusFilter
  const activeFilterCount = (hakemusFilter.evaluator ? 1 : 0) + (hakemusFilter.presenter ? 1 : 0)
  const onClick = () => {
    if(!hakemusFilter.roleIsOpen){
      controller.togglePersonSelect(undefined)
    }
    controller.setFilter("roleIsOpen",!hakemusFilter.roleIsOpen)
  }
  const buttonClass = ClassNames('btn btn-sm btn-simple btn-role ',{
    'btn-role--center': activeFilterCount==0,
    'btn-selected--border': activeFilterCount>0,
  })
  return (
    <div style={{position:'relative'}}>
      <button onClick={onClick} className={buttonClass}><span hidden={activeFilterCount==0} className="btn-role__count">{activeFilterCount}</span></button>
      <PersonSelectPanel state={state} controller={controller} hakemusFilter={hakemusFilter}/>
    </div>
  )
}


export default PersonFilterButton