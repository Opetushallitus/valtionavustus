import React, { useEffect, useState } from 'react'
import ClassNames from 'classnames'
import { debounce } from 'lodash'

import CSSTransitionGroup from 'soresu-form/web/form/component/wrapper/CSSTransitionGroup.jsx'
import NameFormatter from 'soresu-form/web/va/util/NameFormatter'
import { HelpTexts } from 'soresu-form/web/va/types'

import VaUserSearchParameters from './VaUserSearchParameters'
import HelpTooltip from '../HelpTooltip'
import HakujenHallintaController, { SelectedAvustushaku } from '../HakujenHallintaController'
import { Role, RoleType, UserInfo, VaUserSearch } from '../types'

type HakuRolesProps = {
  controller: HakujenHallintaController
  avustushaku: SelectedAvustushaku
  userHasEditPrivilege: boolean
  userHasEditMyHakuRolePrivilege: boolean
  vaUserSearch: VaUserSearch
  userInfo: UserInfo
  helpTexts: HelpTexts
}

export const HakuRoles = ({ avustushaku, controller, helpTexts, userInfo, vaUserSearch, userHasEditPrivilege, userHasEditMyHakuRolePrivilege }: HakuRolesProps) => {
  const [search, setSearch] = useState("")
  useEffect(() => {
    controller.startVaUserSearch(search)
  }, [search])

  const roles = [...(avustushaku.roles ?? [])].sort((a, b) => a.name < b.name ? -1 : 1)
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

  const searchErrorClass = vaUserSearch.result.error ? "error" : "hidden"
  const hasInput = vaUserSearch.input.length > 0
  const clearInputButtonClassname = ClassNames("remove", { enabled: hasInput })
  const vastuuvalmistelija = roles.find(r => r.role === 'vastuuvalmistelija')

  return (
    <div className="haku-roles">
      {vastuuvalmistelija &&
        <div className="haku-roles-vastuuvalmistelija">
          <b>Vastuuvalmistelija: </b><span data-test-id="vastuuvalmistelija">{`${vastuuvalmistelija.name} <${vastuuvalmistelija.email}>`}</span>
        </div>
      }
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

      <div id="va-user-search-add-role">
        <div className="va-user-search-error-display"><span className={searchErrorClass}>Virhe henkilön haussa. Yritä uudestaan eri hakuehdoilla ja lataa sivu uudestaan, jollei se auta.</span></div>
        <div>
          <span>Lisää uusi henkilö: </span><HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___lisää_uusi_henkilö"]} direction="left" />
          <div className="va-user-search-block">
            <input id="va-user-search-input" type="text" placeholder={"Hae"}  value={search} onChange={e => setSearch(e.target.value)} disabled={!roles || !userHasEditPrivilege}/>
            <button type="button" className={clearInputButtonClassname} title="Tyhjennä" disabled={!hasInput} onClick={() => setSearch("")} />
            <PersonSelectList vaUserSearch={vaUserSearch} avustushaku={avustushaku} controller={controller} />
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
}

const privilegesToClassAndDescription = (privileges: string[]) => {
  if (privileges.includes("va-admin")) {
    return { className: "va-admin", description: "VA-pääkäyttäjä" }
  } else if (privileges.includes("va-user")) {
    return { className: "va-user", description: "VA-käyttäjä" }
  }
  return { className: "no-va-access", description: "Ei VA-oikeuksia" }
}

const PersonSelectList = ({ avustushaku, controller, vaUserSearch }: PersonSelectListProps) => {
  const personRows = vaUserSearch.result.results.map(r => {
    const firstName = r["first-name"]
    const surname = r["surname"]
    const email = r["email"]
    const oid = r["person-oid"]
    const newRole = {
      name:  NameFormatter.onlyFirstForename(firstName) + " " + surname,
      email,
      role: "presenting_officer" as RoleType,
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
      <li key={r["person-oid"]} title={titleText} className={personIsInRolesAlready ? "disabled" : undefined}>
        <a href="javascript:" onClick={onClick} className={personIsInRolesAlready ? "disabled" : undefined}>
          {firstName} {surname} ({email ? email + ", " : ""}{accessLevel.description})
        </a>
      </li>
    )
  })
  const resultRows = personRows.length === 0 ? [<li key="no-results-row" className="no-results-row">Ei hakutuloksia.</li>] : personRows
  const searchResultClassNames = ClassNames(undefined, { loading: vaUserSearch.loading,
                                                          hidden: vaUserSearch.input.length < VaUserSearchParameters.minimumSearchInputLength() })
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
  const debouncedSave = debounce(() => { controller.saveRole(avustushaku, role) }, 3000)

  const handleChange = (key: 'email' | 'name' | 'role') => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (key === 'role') {
      role[key] = event.target.value as RoleType
    } else {
      role[key] = event.target.value
    }
    if (typeof event.target.checkValidity !== 'function' || event.target.checkValidity()) {
      debouncedSave()
    }
    controller.reRender()
  }

  const thisRowIsMe = role.oid === userInfo["person-oid"]
  const disableEditing = !userHasEditPrivilege || (thisRowIsMe && !userHasEditMyHakuRolePrivilege)
  const removeTitleText = (disableEditing && userHasEditPrivilege) ? "Et voi poistaa itseltäsi oikeuksia hakuun" : "Poista"
  const onDelete = controller.deleteRole(avustushaku, role)
  return (
    <tr data-test-id={`role-${role.name.toLowerCase().replace(" ","-")}`}>
      <td className="haku-roles-role-column">
        <select onChange={handleChange('role')} name="role" value={role.role} disabled={disableEditing}>
          <option value="presenting_officer">Valmistelija</option>
          <option value="evaluator">Arvioija</option>
        </select>
      </td>
      <td className="haku-roles-name-column">
        <input type="text" value={role.name} name="name" onChange={handleChange('name')} disabled={disableEditing}/>
      </td>
      <td className="haku-roles-email-column">
        <input type="email" value={role.email || ""} name="email" onChange={handleChange('email')} disabled={disableEditing}/>
        <button type="button" onClick={onDelete} className="remove haku-roles-remove" title={removeTitleText} tabIndex={-1} disabled={disableEditing} />
      </td>
    </tr>
  )
}
