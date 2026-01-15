import React from 'react'
import classNames from 'classnames'
import { useHakemustenArviointiSelector } from '../arviointiStore'

import * as styles from './Person.module.css'

export type RoleField = 'evaluator' | 'presenter'

const getRoleButtonAriaLabel = (roleField: RoleField, name: string) => {
  return roleField === 'presenter' ? `Rajaa valmistelijalla ${name}` : `Rajaa arvioijalla ${name}`
}

interface ControlledSelectPanelProps {
  onClickClose: () => void
  roleField: RoleField
  onClickRole: (id: number) => void
  activeId?: number
}

export function ControlledSelectPanel({
  roleField,
  onClickClose,
  onClickRole,
  activeId,
}: ControlledSelectPanelProps) {
  const roles = useHakemustenArviointiSelector(
    (state) => state.arviointi.avustushakuData?.hakuData.roles
  )
  const roleName = {
    presenter: 'Valmistelija',
    evaluator: 'Arvioija',
  }
  const roleFieldRoles =
    roleField === 'presenter'
      ? roles?.filter((r) => ['presenting_officer', 'vastuuvalmistelija'].includes(r.role))
      : roles
  return (
    <React.Fragment>
      <button
        onClick={onClickClose}
        className={styles.close}
        aria-label="Sulje valmistelija ja arvioija rajain"
      />
      <div className={styles.roleTitle}>{[roleName[roleField]]}</div>
      <div className={styles.roleContainer}>
        {roleFieldRoles?.map(({ id, name }) => {
          const active = id === activeId
          return (
            <button
              key={`${roleField}-${id}`}
              onClick={() => onClickRole(id)}
              aria-label={getRoleButtonAriaLabel(roleField, name)}
              className={classNames(styles.roleButton, {
                [styles.selected]: active,
              })}
            >
              {name}
            </button>
          )
        })}
      </div>
    </React.Fragment>
  )
}
