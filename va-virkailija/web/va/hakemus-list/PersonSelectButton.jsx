import React from 'react'
import ClassNames from 'classnames'

const RoleButton = ({role,roleField,controller,hakemus}) => {
  const onClick = () => controller.toggleHakemusRole(role.id,hakemus,roleField)
  const currentRoles = hakemus.arvio.roles[roleField]
  const active = roleField=="presenter" ? hakemus.arvio["presenter-role-id"]==role.id : _.includes(currentRoles,role.id)
  const buttonClass = ClassNames('btn btn-sm',{
    'btn-selected': active,
    'btn-simple': !active
  })
  return (
    <button className={buttonClass} onClick={onClick}>{role.name}</button>
  )
}

const RoleContainer = ({roleName,roleField,roles,controller,hakemus}) => {
  return(
    <div className="role-container">
      <div className="text-grey role-title">{roleName}</div>
      {roles.map((role)=>(<RoleButton key={role.id} role={role} roleField={roleField} controller={controller} hakemus={hakemus}/>))}
    </div>
  )
}

const PersonSelectPanel = ({hakemus,state,controller}) => {
  const show = state.personSelectHakemusId==hakemus.id
  if (!show) return <span/>
  const roles = state.hakuData.roles
  const filterByRole = (roles,role)=> _.sortBy(roles.filter((currentRole)=>currentRole.role==role),'name')
  const presenters = filterByRole(roles,"presenting_officer")
  const evaluators = filterByRole(roles,"evaluator")
  const onCloseClick = () => controller.togglePersonSelect(undefined)
  return (
    <div className="panel person-panel person-panel--top">
      <button className="close" onClick={onCloseClick}>x</button>
      <RoleContainer roleName="Esittelijä" roleField="presenter" roles={presenters} controller={controller} hakemus={hakemus}/>
      <RoleContainer roleName="Arvioijat" roleField="evaluators" roles={evaluators} controller={controller} hakemus={hakemus}/>
    </div>
  )
}


const PersonSelectButton = ({controller,hakemus,state,show}) => {
  if (!show) return <span/>
  const onClick = () => {
    controller.togglePersonSelect(hakemus.id)
  }
  const roles = _.pluck(state.hakuData.roles,'id')
  const presenterRoleId = hakemus.arvio["presenter-role-id"];
  const personCount = hakemus.arvio.roles.evaluators.filter((id)=>_.includes(roles,id)).length + (presenterRoleId && _.includes(roles,presenterRoleId) ? 1 : 0)
  const countIndicator = personCount > 0 ? personCount : "+"
  return(
    <div>
      <button onClick={onClick} className="btn btn-sm btn-simple btn-role"><span className="btn-role__count">{countIndicator}</span></button>
      <PersonSelectPanel hakemus={hakemus} state={state} controller={controller}/>
    </div>
  )
}

export default PersonSelectButton
