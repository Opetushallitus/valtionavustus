import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';
import ClassNames from 'classnames'
import { debounce, isEqual } from 'lodash'

import CSSTransitionGroup from 'soresu-form/web/form/component/wrapper/CSSTransitionGroup.jsx'
import NameFormatter from 'soresu-form/web/va/util/NameFormatter'
import { HelpTexts } from 'soresu-form/web/va/types'

import HelpTooltip from '../HelpTooltip'
import HakujenHallintaController, { SelectedAvustushaku } from '../HakujenHallintaController'
import { Role, RoleType, UserInfo, VaUserSearch } from '../types'
import { minimumSearchInputLength, useVaUserSearch } from '../VaUserSearch'

type HakuRolesProps = {
  controller: HakujenHallintaController
  avustushaku: SelectedAvustushaku
  userHasEditPrivilege: boolean
  userHasEditMyHakuRolePrivilege: boolean
  userInfo: UserInfo
  helpTexts: HelpTexts
}

export const HakuRoles = ({ avustushaku, controller, helpTexts, userInfo, userHasEditPrivilege, userHasEditMyHakuRolePrivilege }: HakuRolesProps) => {
  const [vastuuvalmistelijaSearchInput, setVastuuvalmistelijaSearchInput, vastuuvalmistelijaSearch] = useVaUserSearch()
  const [roleSearchInput, setRoleSearchInput, roleSearch] = useVaUserSearch()
  const roles = [...(avustushaku.roles ?? [])].sort((a, b) => a.name < b.name ? -1 : 1)
  const vastuuvalmistelija = roles.find(r => r.role === 'vastuuvalmistelija')
  const roleRows = roles
    .filter(r => r.role !== 'vastuuvalmistelija')
    .map(role => (
        <RoleRow key={role.id}
                  role={role}
                  avustushaku={avustushaku}
                  userInfo={userInfo}
                  userHasEditPrivilege={userHasEditPrivilege}
                  userHasEditMyHakuRolePrivilege={userHasEditMyHakuRolePrivilege}
                  controller={controller}
        />
    ))

  return (
    <div className="haku-roles">
      <div id="vastuuvalmistelija">
        {vastuuvalmistelija &&
          <div className="haku-roles-vastuuvalmistelija">
            <b>Vastuuvalmistelija: </b>
            <Vastuuvalmistelija
              role={vastuuvalmistelija}
              avustushaku={avustushaku}
              userInfo={userInfo}
              userHasEditPrivilege={userHasEditPrivilege}
              userHasEditMyHakuRolePrivilege={userHasEditMyHakuRolePrivilege}
              controller={controller}
            />
          </div>
        }
        <div className="va-user-search-add-role">
          <div className="va-user-search-error-display">
            <span className={vastuuvalmistelijaSearch.result.error ? "error" : "hidden"}>
              Virhe henkilön haussa. Yritä uudestaan eri hakuehdoilla ja lataa sivu uudestaan, jollei se auta.
            </span>
          </div>
          <span>Vaihda vastuuvalmistelijaa: </span>
          <div className="va-user-search-block">
            <input id="va-user-search-vastuuvalmistelija" type="text" placeholder={"Hae"} value={vastuuvalmistelijaSearchInput} onChange={e => setVastuuvalmistelijaSearchInput(e.target.value)} disabled={!roles || !userHasEditPrivilege}/>
            <button data-test-id="clear-vastuuvalmistelija-search" type="button" className={ClassNames("remove", { enabled: !!vastuuvalmistelijaSearchInput.length })} title="Tyhjennä" disabled={!vastuuvalmistelijaSearchInput.length} onClick={() => setVastuuvalmistelijaSearchInput("")} />
            <PersonSelectList roleType="vastuuvalmistelija" vaUserSearch={vastuuvalmistelijaSearch} input={vastuuvalmistelijaSearchInput} avustushaku={avustushaku} controller={controller} />
          </div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th className="haku-roles-role-column">Rooli <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___rooli"]} direction="left" /></th>
            <th className="haku-roles-name-column">Nimi <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___nimi"]} direction="left" /></th>
            <th className="haku-roles-email-column">Sähköposti <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___sähköposti"]} direction="left" /></th>
          </tr>
        </thead>
        <CSSTransitionGroup transitionName="haku-roles-transition" component="tbody">
          {roleRows}
        </CSSTransitionGroup>
      </table>

      <div id="roles-list" className="va-user-search-add-role">
        <div className="va-user-search-error-display">
          <span className={roleSearch.result.error ? "error" : "hidden"}>
            Virhe henkilön haussa. Yritä uudestaan eri hakuehdoilla ja lataa sivu uudestaan, jollei se auta.
          </span>
        </div>
        <div>
          <span>Lisää uusi henkilö: </span><HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___lisää_uusi_henkilö"]} direction="left" />
          <div className="va-user-search-block">
            <input id="va-user-search-input" type="text" placeholder={"Hae"} value={roleSearchInput} onChange={e => setRoleSearchInput(e.target.value)} disabled={!roles || !userHasEditPrivilege}/>
            <button data-test-id="clear-role-search" type="button" className={ClassNames("remove", { enabled: !!roleSearchInput.length })} title="Tyhjennä" disabled={!roleSearchInput.length} onClick={() => setRoleSearchInput("")} />
            <PersonSelectList vaUserSearch={roleSearch} input={roleSearchInput} avustushaku={avustushaku} controller={controller} />
          </div>
        </div>
      </div>
    </div>
  )
}

type PersonSelectListProps = {
  vaUserSearch: VaUserSearch
  avustushaku: SelectedAvustushaku
  controller: HakujenHallintaController
  input: string
  roleType?: RoleType
}

const privilegesToClassAndDescription = (privileges: string[]) => {
  if (privileges.includes("va-admin")) {
    return { className: "va-admin", description: "VA-pääkäyttäjä" }
  } else if (privileges.includes("va-user")) {
    return { className: "va-user", description: "VA-käyttäjä" }
  }
  return { className: "no-va-access", description: "Ei VA-oikeuksia" }
}

const PersonSelectList = ({ avustushaku, controller, vaUserSearch, input, roleType }: PersonSelectListProps) => {
  const personRows = vaUserSearch.result.results.map(r => {
    const firstName = r["first-name"]
    const surname = r["surname"]
    const email = r["email"]
    const oid = r["person-oid"]
    const newRole = {
      name:  NameFormatter.onlyFirstForename(firstName) + " " + surname,
      email,
      role: roleType ?? "presenting_officer",
      oid
    }
    const accessLevel = privilegesToClassAndDescription(r.privileges)
    const personIsInRolesAlready = avustushaku.roles?.find(r => r.oid === oid)
    const titleText = `${firstName} ${surname} ${email ? "<" + email + "> " : ""}(${accessLevel.description}, oid ${oid})${personIsInRolesAlready ? ' (Käyttäjä on jo lisätty avustushakuun)' : ''}`
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (!personIsInRolesAlready) {
        controller.createRole(avustushaku, newRole)()
      }
    }

    return (
      <li key={r["person-oid"]} data-test-id={r["person-oid"]} title={titleText} className={personIsInRolesAlready ? "disabled" : undefined}>
        <a onClick={onClick} className={personIsInRolesAlready ? "disabled" : undefined}>
          {firstName} {surname} ({email ? email + ", " : ""}{accessLevel.description})
        </a>
      </li>
    )
  })
  const resultRows = personRows.length === 0 ? [<li key="no-results-row" className="no-results-row">Ei hakutuloksia.</li>] : personRows
  const searchResultClassNames = ClassNames(undefined, { loading: vaUserSearch.loading,
                                                          hidden: input.length < minimumSearchInputLength })
  return (
    <div id="va-user-search-results" className={searchResultClassNames}>
      <ul className={searchResultClassNames}>
        {resultRows}
      </ul>
    </div>
  )
}

type RoleRowProps = {
  controller: HakujenHallintaController
  avustushaku: SelectedAvustushaku
  role: Role
  userInfo: UserInfo
  userHasEditPrivilege: boolean
  userHasEditMyHakuRolePrivilege: boolean
}

const RoleRow = ({ avustushaku, controller, role, userInfo, userHasEditPrivilege, userHasEditMyHakuRolePrivilege }: RoleRowProps) => {
  const debouncedSave = useCallback(debounce((savedRole: Role) => { controller.saveRole(avustushaku, savedRole) }, 3000), [])
  const [editedRole, setEditedRole] = useState(role)
  const [emailOk, setEmailOk] = useState(true)

  useEffect(() => {
    if (emailOk && !isEqual(role, editedRole)) {
      debouncedSave(editedRole)
    }
  }, [editedRole])

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOk(event.target.checkValidity())
    setEditedRole({ ...editedRole, email: event.target.value })
  }

  const thisRowIsMe = role.oid === userInfo["person-oid"]
  const disableEditing = !userHasEditPrivilege || (thisRowIsMe && !userHasEditMyHakuRolePrivilege)
  const removeTitleText = (disableEditing && userHasEditPrivilege) ? "Et voi poistaa itseltäsi oikeuksia hakuun" : "Poista"
  const onDelete = controller.deleteRole(avustushaku, role)
  return (
    <tr data-test-id={`role-${role.name.toLowerCase().replace(" ","-")}`}>
      <td className="haku-roles-role-column">
        <select onChange={(e) => setEditedRole({ ...editedRole, role: e.target.value as RoleType })} name="role" value={editedRole.role} disabled={disableEditing}>
          <option value="presenting_officer">Valmistelija</option>
          <option value="evaluator">Arvioija</option>
        </select>
      </td>
      <td className="haku-roles-name-column">
        <input type="text" value={editedRole.name} name="name" onChange={(e) => setEditedRole({ ...editedRole, name: e.target.value })} disabled={disableEditing}/>
      </td>
      <td className="haku-roles-email-column">
        <input type="email" value={editedRole.email || ""} name="email" onChange={handleEmailChange} disabled={disableEditing}/>
        <button type="button" onClick={onDelete} className="remove haku-roles-remove" title={removeTitleText} tabIndex={-1} disabled={disableEditing} />
      </td>
    </tr>
  )
}

const Vastuuvalmistelija = ({ avustushaku, controller, role, userInfo, userHasEditPrivilege, userHasEditMyHakuRolePrivilege }: RoleRowProps) => {
  const debouncedSave = useCallback(debounce((savedRole: Role) => { controller.saveRole(avustushaku, savedRole) }, 3000), [])
  const [editedRole, setEditedRole] = useState(role)
  const [emailOk, setEmailOk] = useState(true)
  const thisRowIsMe = role.oid === userInfo["person-oid"]
  const disableEditing = !userHasEditPrivilege || (thisRowIsMe && !userHasEditMyHakuRolePrivilege)

  useEffect(() => {
    if (emailOk && !isEqual(role, editedRole)) {
      debouncedSave(editedRole)
    }
  }, [editedRole])

  useEffect(() => {
    if (role.oid !== editedRole.oid) {
      setEditedRole(role)
    }
  }, [role])

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOk(event.target.checkValidity())
    setEditedRole({ ...editedRole, email: event.target.value })
  }

  return (
    <span className="haku-roles-vastuuvalmistelija">
      <input data-test-id="vastuuvalmistelija-name" type="text" value={editedRole.name} name="name" onChange={(e) => setEditedRole({ ...editedRole, name: e.target.value })} placeholder="Nimi" disabled={disableEditing}/>
      <input data-test-id="vastuuvalmistelija-email" type="email" value={editedRole.email ?? ""} name="email" onChange={handleEmailChange} placeholder="Email" disabled={disableEditing}/>
    </span>
  )
}
