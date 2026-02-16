import React, { useEffect, useState } from 'react'
import ClassNames from 'classnames'

import NameFormatter from 'soresu-form/web/va/util/NameFormatter'
import { HelpTexts } from 'soresu-form/web/va/types'

import HelpTooltip from '../../common-components/HelpTooltip'
import { Role, RoleType, UserInfo, VaUserSearch } from '../../types'
import { minimumSearchInputLength, useVaUserSearch } from '../../VaUserSearch'
import { useHakujenHallintaDispatch } from '../hakujenHallintaStore'
import {
  createHakuRole,
  deleteRole,
  VirkailijaAvustushaku,
  debouncedSaveRole,
  saveRoleImmediately,
} from '../hakuReducer'

type HakuRolesProps = {
  avustushaku: VirkailijaAvustushaku
  userHasEditPrivilege: boolean
  userHasEditMyHakuRolePrivilege: boolean
  userInfo: UserInfo
  helpTexts: HelpTexts
}

export const HakuRoles = ({
  avustushaku,
  helpTexts,
  userInfo,
  userHasEditPrivilege,
  userHasEditMyHakuRolePrivilege,
}: HakuRolesProps) => {
  const [roleSearchInput, setRoleSearchInput, roleSearch] = useVaUserSearch()
  const roles = [...(avustushaku.roles ?? [])].sort((a, b) => (a.name < b.name ? -1 : 1))

  return (
    <div className="haku-roles">
      <table>
        <thead>
          <tr>
            <th className="haku-roles-role-column">
              Rooli
              <HelpTooltip
                content={helpTexts['hakujen_hallinta__haun_tiedot___rooli']}
                direction="left"
              />
            </th>
            <th className="haku-roles-name-column">
              Nimi
              <HelpTooltip
                content={helpTexts['hakujen_hallinta__haun_tiedot___nimi']}
                direction="left"
              />
            </th>
            <th className="haku-roles-email-column">
              Sähköposti
              <HelpTooltip
                content={helpTexts['hakujen_hallinta__haun_tiedot___sähköposti']}
                direction="left"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              avustushaku={avustushaku}
              userInfo={userInfo}
              userHasEditPrivilege={userHasEditPrivilege}
              userHasEditMyHakuRolePrivilege={userHasEditMyHakuRolePrivilege}
            />
          ))}
        </tbody>
      </table>

      <div id="roles-list" className="va-user-search-add-role">
        <div className="va-user-search-error-display">
          <span className={roleSearch.result.error ? 'error' : 'hidden'}>
            Virhe henkilön haussa. Yritä uudestaan eri hakuehdoilla ja lataa sivu uudestaan, jollei
            se auta.
          </span>
        </div>
        <div>
          <div>
            Lisää uusi henkilö rooleihin:
            <HelpTooltip
              content={helpTexts['hakujen_hallinta__haun_tiedot___lisää_uusi_henkilö']}
              direction="left"
            />
          </div>
          <div className="va-user-search-block">
            <input
              id="va-user-search-input"
              type="text"
              placeholder={'Hae'}
              value={roleSearchInput}
              onChange={(e) => setRoleSearchInput(e.target.value)}
              disabled={!roles || !userHasEditPrivilege}
            />
            <button
              data-test-id="clear-role-search"
              type="button"
              className={ClassNames('remove', {
                enabled: !!roleSearchInput.length,
              })}
              title="Tyhjennä"
              disabled={!roleSearchInput.length}
              onClick={() => setRoleSearchInput('')}
            />
            <PersonSelectList
              vaUserSearch={roleSearch}
              input={roleSearchInput}
              avustushaku={avustushaku}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

type PersonSelectListProps = {
  vaUserSearch: VaUserSearch
  avustushaku: VirkailijaAvustushaku
  input: string
  roleType?: RoleType
}

const privilegesToClassAndDescription = (privileges: string[]) => {
  if (privileges.includes('va-admin')) {
    return { className: 'va-admin', description: 'VA-pääkäyttäjä' }
  } else if (privileges.includes('va-user')) {
    return { className: 'va-user', description: 'VA-käyttäjä' }
  }
  return { className: 'no-va-access', description: 'Ei VA-oikeuksia' }
}

const PersonSelectList = ({
  avustushaku,
  vaUserSearch,
  input,
  roleType,
}: PersonSelectListProps) => {
  const dispatch = useHakujenHallintaDispatch()
  const personRows = vaUserSearch.result.results.map((r) => {
    const firstName = r['first-name']
    const surname = r['surname']
    const email = r['email']
    const oid = r['person-oid']
    const newRole = {
      name: NameFormatter.onlyFirstForename(firstName) + ' ' + surname,
      email,
      role: roleType ?? 'presenting_officer',
      oid,
    }
    const accessLevel = privilegesToClassAndDescription(r.privileges)
    const personIsInRolesAlready = avustushaku.roles?.find((r) => r.oid === oid)
    const titleText = `${firstName} ${surname} ${email ? '<' + email + '> ' : ''}(${
      accessLevel.description
    }, oid ${oid})${personIsInRolesAlready ? ' (Käyttäjä on jo lisätty avustushakuun)' : ''}`
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (!personIsInRolesAlready) {
        dispatch(createHakuRole({ role: newRole, avustushakuId: avustushaku.id }))
      }
    }

    return (
      <li
        key={r['person-oid']}
        data-test-id={r['person-oid']}
        title={titleText}
        className={personIsInRolesAlready ? 'disabled' : undefined}
      >
        <a onClick={onClick} className={personIsInRolesAlready ? 'disabled' : undefined}>
          {firstName} {surname} ({email ? email + ', ' : ''}
          {accessLevel.description})
        </a>
      </li>
    )
  })
  const resultRows =
    personRows.length === 0
      ? [
          <li key="no-results-row" className="no-results-row">
            Ei hakutuloksia.
          </li>,
        ]
      : personRows
  const searchResultClassNames = ClassNames(undefined, {
    loading: vaUserSearch.loading,
    hidden: input.length < minimumSearchInputLength,
  })
  return (
    <div id="va-user-search-results" className={searchResultClassNames}>
      <ul className={searchResultClassNames}>{resultRows}</ul>
    </div>
  )
}

type RoleRowProps = {
  avustushaku: VirkailijaAvustushaku
  role: Role
  userInfo: UserInfo
  userHasEditPrivilege: boolean
  userHasEditMyHakuRolePrivilege: boolean
}

const RoleRow = ({
  avustushaku,
  role,
  userInfo,
  userHasEditPrivilege,
  userHasEditMyHakuRolePrivilege,
}: RoleRowProps) => {
  const dispatch = useHakujenHallintaDispatch()
  const [editedRole, setEditedRole] = useState(role)
  const [emailOk, setEmailOk] = useState(true)

  useEffect(() => {
    setEditedRole(role)
  }, [role])

  useEffect(() => {
    if (emailOk && (role.name !== editedRole.name || role.email !== editedRole.email)) {
      dispatch(debouncedSaveRole({ role: editedRole, avustushakuId: avustushaku.id }))
    }
  }, [editedRole.name, editedRole.email])

  const handleRoleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = { ...editedRole, role: e.target.value as RoleType }
    setEditedRole(newRole)
    dispatch(saveRoleImmediately({ role: newRole, avustushakuId: avustushaku.id }))
  }

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOk(event.target.checkValidity())
    setEditedRole({ ...editedRole, email: event.target.value })
  }

  const thisRowIsMe = role.oid === userInfo['person-oid']
  const disableEditing = !userHasEditPrivilege || (thisRowIsMe && !userHasEditMyHakuRolePrivilege)
  const disableChangingVastuuvalmistelija = disableEditing || role.role === 'vastuuvalmistelija'
  const removeTitleText =
    disableEditing && userHasEditPrivilege
      ? 'Et voi poistaa itseltäsi oikeuksia hakuun'
      : disableChangingVastuuvalmistelija
        ? 'Vastuuvalmistelijaa ei voi poistaa'
        : 'Poista'
  const onDelete = () => dispatch(deleteRole({ avustushakuId: avustushaku.id, roleId: role.id }))

  return (
    <tr
      key={`${role.oid}-${role.role}`}
      data-test-id={`role-${role.name.toLowerCase().replace(' ', '-')}`}
    >
      <td className="haku-roles-role-column">
        <select
          onChange={handleRoleTypeChange}
          name="role"
          value={editedRole.role}
          disabled={disableChangingVastuuvalmistelija}
        >
          <option value="presenting_officer">Valmistelija</option>
          <option value="evaluator">Arvioija</option>
          <option value="vastuuvalmistelija">Vastuuvalmistelija</option>
        </select>
      </td>
      <td className="haku-roles-name-column">
        <input
          type="text"
          value={editedRole.name}
          name="name"
          onChange={(e) => setEditedRole({ ...editedRole, name: e.target.value })}
          disabled={disableEditing}
          data-test-id={`${role.role}-name`}
        />
      </td>
      <td className="haku-roles-email-column">
        <input
          type="email"
          value={editedRole.email || ''}
          name="email"
          onChange={handleEmailChange}
          disabled={disableEditing}
          data-test-id={`${role.role}-email`}
        />
        <button
          type="button"
          onClick={onDelete}
          className="remove haku-roles-remove"
          title={removeTitleText}
          tabIndex={-1}
          disabled={disableChangingVastuuvalmistelija}
        />
      </td>
    </tr>
  )
}
