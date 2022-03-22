import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

const RoleButton = ({role,roleField,controller,hakemus}) => {
  const onClick = () => controller.toggleHakemusRole(role.id,hakemus,roleField)
  const currentRoles = hakemus.arvio.roles[roleField]
  const active = roleField === "presenter" ? hakemus.arvio["presenter-role-id"] === role.id : _.includes(currentRoles,role.id)
  const buttonClass = ClassNames('btn btn-sm',{
    'btn-selected': active,
    'btn-simple': !active
  })
  return (
    <button className={buttonClass} onClick={onClick}>{role.name}</button>
  )
}

const RoleContainer = ({roleName,roleField,roles,controller,hakemus}) => {
  return (
    <React.Fragment>
      <div className="role-title">{roleName}</div>
      <div className="role-container">
        {roles.map((role)=>(<RoleButton key={role.id} role={role} roleField={roleField} controller={controller} hakemus={hakemus}/>))}
      </div>
    </React.Fragment>
  )
}

const PersonSelectPanel = ({hakemus,state,controller}) => {
  const show = state.personSelectHakemusId === hakemus.id
  if (!show) {
    return <span/>
  }
  const roles = state.hakuData.roles
  const filterByRole = (roles, filteredRoles)=> _.sortBy(roles.filter((currentRole) => filteredRoles.includes(currentRole.role)),'name')
  const presenters = filterByRole(roles, ["presenting_officer", "vastuuvalmistelija"])
  const evaluators = filterByRole(roles, ["evaluator"])
  const onCloseClick = () => controller.togglePersonSelect(undefined)
  return (
    <div className="panel person-panel person-panel--top">
      <button className="close" onClick={onCloseClick} data-test-id="close-person-select-panel">x</button>
      <RoleContainer roleName="Valmistelija" roleField="presenter" roles={presenters} controller={controller} hakemus={hakemus}/>
      <RoleContainer roleName="Arvioijat" roleField="evaluators" roles={evaluators} controller={controller} hakemus={hakemus}/>
    </div>
  )
}


const PersonSelectButton = ({controller,hakemus,state,show}) => {
  if (!show) {
    return <span/>
  }
  const onClick = () => {
    controller.togglePersonSelect(hakemus.id)
    document.body.classList.add('split-view')
  }
  const roles = _.map(state.hakuData.roles,'id')
  const presenterRoleId = hakemus.arvio["presenter-role-id"]
  const personCount = hakemus.arvio.roles.evaluators.filter(id => _.includes(roles,id)).length + (presenterRoleId && _.includes(roles,presenterRoleId) ? 1 : 0)
  const countIndicator = personCount > 0 ? personCount : "+"
  const presenter = state.hakuData.roles.find(r => r.id === presenterRoleId)
  const presenterName = presenter ? presenter.name : ""
  return(
    <div>
      <button onClick={onClick} className="btn btn-sm btn-simple btn-role"
              title={presenterName}>
        <span className="btn-role__count">{countIndicator}</span>
      </button>
      <PersonSelectPanel hakemus={hakemus} state={state} controller={controller}/>
    </div>
  )
}

export default PersonSelectButton
