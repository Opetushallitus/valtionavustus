import React from 'react'
import classNames from 'classnames'

import { Hakemus } from 'soresu-form/web/va/types'

import { Role } from '../../types'

import { useHakemustenArviointiDispatch, useHakemustenArviointiSelector } from '../arviointiStore'
import {
  getLoadedAvustushakuData,
  setArvioValue,
  startHakemusArvioAutoSave,
} from '../arviointiReducer'

import * as styles from './Person.module.css'

export const isPresenterRole = ({ role }: Role): boolean =>
  ['presenting_officer', 'vastuuvalmistelija'].includes(role)
export const isPresenter = (hakemus: Hakemus, { id }: { id: number }) =>
  hakemus.arvio['presenter-role-id'] === id
export const isEvaluator = (hakemus: Hakemus, { id }: { id: number }) =>
  hakemus.arvio.roles['evaluators'].includes(id)

type RoleButtonProps = {
  role: Role
  roleField: 'evaluators' | 'presenter'
  hakemus: Hakemus
}

const getRoleButtonAriaLabel = (isPresenterField: boolean, active: boolean, name: string) => {
  if (isPresenterField) {
    return active ? `Poista ${name} valmistelijan roolista` : `Lisää ${name} valmistelijaksi`
  }
  return active ? `Poista ${name} arvioijan roolista` : `Lisää ${name} arvioijaksi`
}

const RoleButton = ({ role, roleField, hakemus }: RoleButtonProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const isPresenterField = roleField === 'presenter'
  const active = isPresenterField ? isPresenter(hakemus, role) : isEvaluator(hakemus, role)
  const { id: roleId, name } = role
  const ariaLabel = getRoleButtonAriaLabel(isPresenterField, active, name)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (roleField === 'presenter') {
          dispatch(
            setArvioValue({
              hakemusId: hakemus.id,
              key: 'presenter-role-id',
              value: roleId,
            })
          )
        } else {
          const currentRoles = hakemus.arvio.roles[roleField]
          const newRoles = {
            ...hakemus.arvio.roles,
            [roleField]: currentRoles.includes(roleId)
              ? currentRoles.filter((id) => id !== roleId)
              : currentRoles.concat(roleId),
          }
          dispatch(
            setArvioValue({
              hakemusId: hakemus.id,
              key: 'roles',
              value: newRoles,
            })
          )
        }
        dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
      }}
      className={classNames(styles.roleButton, { [styles.selected]: active })}
      aria-label={ariaLabel}
    >
      {role.name}
    </button>
  )
}

type RoleContainerProps = {
  roleName: string
  roleField: 'evaluators' | 'presenter'
  roles: Role[]
  hakemus: Hakemus
}

const RoleContainer = ({ roleName, roleField, roles, hakemus }: RoleContainerProps) => {
  return (
    <React.Fragment>
      <div className={styles.roleTitle}>{roleName}</div>
      <div className={styles.roleContainer}>
        {roles.map((role) => (
          <RoleButton
            key={`${roleName}-${role.id}`}
            role={role}
            roleField={roleField}
            hakemus={hakemus}
          />
        ))}
      </div>
    </React.Fragment>
  )
}

type PersonSelectButtonProps = {
  hakemus: Hakemus
  toggleUkotusModal: (hakemusId: number | undefined, anchorElement?: HTMLElement | null) => void
}

export const PersonSelectPanel = ({ hakemus, toggleUkotusModal }: PersonSelectButtonProps) => {
  const hakuDataRoles = useHakemustenArviointiSelector(
    (state) => getLoadedAvustushakuData(state.arviointi).hakuData.roles
  )
  const roles = [...hakuDataRoles].sort((a, b) => (a.name > b.name ? -1 : 1))
  const presenters = roles.filter(isPresenterRole)
  const registerNumber = hakemus['register-number'] ?? ''
  const projectName = hakemus['project-name']
  const title = `${registerNumber} ${projectName}`.trim()
  return (
    <div data-test-id="ukotusModal" className="panel person-panel person-panel--top">
      <p>{title}</p>
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleUkotusModal(undefined)
        }}
        className={styles.close}
        aria-label="Sulje valmistelija ja arvioija valitsin"
      />
      <RoleContainer
        roleName="Valmistelija"
        roleField="presenter"
        roles={presenters}
        hakemus={hakemus}
      />
      <RoleContainer roleName="Arvioijat" roleField="evaluators" roles={roles} hakemus={hakemus} />
    </div>
  )
}
