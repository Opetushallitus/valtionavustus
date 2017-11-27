import React, { Component } from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'

import CSSTransitionGroup from 'soresu-form/web/form/component/wrapper/CSSTransitionGroup.jsx'
import NameFormatter from 'va-common/web/va/util/NameFormatter'
import VaUserSearchParameters from './VaUserSearchParameters'

export default class HakuRoles extends Component {
  render() {
    const {controller, avustushaku, userHasEditPrivilege, vaUserSearch, userInfo} = this.props
    const roles = _.sortBy(avustushaku.roles, 'name')
    const roleRows = roles ? roles.map(role => <RoleRow key={role.id} role={role} avustushaku={avustushaku} userInfo={userInfo} userHasEditPrivilege={userHasEditPrivilege} controller={controller}/>) : []

    const startSearch = e => {
      const input = _.trim(e.target.value)
      controller.startVaUserSearch(input)
    }

    const searchErrorClass = vaUserSearch.result.error ? "error" : "hidden"
    const hasInput = vaUserSearch.input.length > 0
    const clearInputButtonClassname = ClassNames("remove", { enabled: hasInput })

    return (
      <div className="haku-roles">
        <table>
          <thead>
            <tr>
              <th className="haku-roles-role-column">Rooli</th>
              <th className="haku-roles-name-column">Nimi</th>
              <th className="haku-roles-email-column">Sähköposti</th>
            </tr>
          </thead>
          <CSSTransitionGroup transitionName="haku-roles-transition" component="tbody">
          {roleRows}
          </CSSTransitionGroup>
        </table>

        <div id="va-user-search-add-role">
          <div className="va-user-search-error-display"><span className={searchErrorClass}>Virhe henkilön haussa. Yritä uudestaan eri hakuehdoilla ja lataa sivu uudestaan, jollei se auta.</span></div>
          <div>
            <span>Lisää uusi henkilö: </span>
            <div className="va-user-search-block">
              <input id="va-user-search-input" type="text" placeholder={"Hae"} onChange={startSearch} disabled={!roles || !userHasEditPrivilege}/>
                <button type="button" className={clearInputButtonClassname} title="Tyhjennä" disabled={!hasInput} onClick={(e) => {
                  const vaUserSearchInput = document.getElementById('va-user-search-input')
                  vaUserSearchInput.value = ''
                  startSearch(e)
                }} />
                <PersonSelectList vaUserSearch={vaUserSearch} avustushaku={avustushaku} controller={controller} />
            </div>
          </div>
        </div>
      </div>
    )

  }
}

class PersonSelectList extends React.Component {
  render() {
    const {vaUserSearch, avustushaku, controller} = this.props
    const personRows = _.map(vaUserSearch.result.results, r => {
      const firstName = r["first-name"]
      const surname = r["surname"]
      const email = r["email"]
      const oid = r["person-oid"]
      const newRole = {
        name:  NameFormatter.onlyFirstForename(firstName) + " " + surname,
        email: email,
        role:  null,
        oid:   oid
      }
      const accessLevel = PersonSelectList.privilegesToClassAndDescription(r.privileges)
      const personIsInRolesAlready = _.some(avustushaku.roles, r => r.oid === oid)
      const titleText = `${firstName} ${surname} ${email ? "<" + email + "> " : ""}(${accessLevel.description}, oid ${oid})${personIsInRolesAlready ? ' (Käyttäjä on jo lisätty avustushakuun)' : ''}`
      const onClick = e => {
        e.preventDefault()
        if (!personIsInRolesAlready) {
          controller.createRole(avustushaku, newRole)()
        }
      }

      return (
        <li key={r["person-oid"]} title={titleText} className={personIsInRolesAlready ? "disabled" : null}>
          <a href="javascript:" onClick={onClick} className={personIsInRolesAlready ? "disabled" : null}>
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

  static privilegesToClassAndDescription(privileges) {
    if (_.includes(privileges, "va-admin")) {
      return { className: "va-admin", description: "VA-pääkäyttäjä" }
    } else if (_.includes(privileges, "va-user")) {
      return { className: "va-user", description: "VA-käyttäjä" }
    }
    return { className: "no-va-access", description: "Ei VA-oikeuksia" }
  }
}

class RoleRow extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.debouncedSave = _.debounce(() => {
      this.props.controller.saveRole(this.props.avustushaku, this.props.role)
    }, 3000).bind(this)
  }

  handleChange(event) {
    this.props.role[event.target.name] = event.target.value
    this.debouncedSave()
    this.props.controller.reRender()
  }

  render() {
    const {role, controller, avustushaku, userInfo, privileges, userHasEditPrivilege} = this.props
    const thisRowIsMe = role.oid === userInfo["person-oid"]
    const disableEditing = !userHasEditPrivilege || (thisRowIsMe && privileges && !privileges["edit-my-haku-role"])
    const removeTitleText = disableEditing && userHasEditPrivilege ? "Et voi poistaa itseltäsi oikeuksia hakuun" : "Poista"
    const onDelete = controller.deleteRole(avustushaku, role)
    return (
      <tr>
        <td className="haku-roles-role-column">
          <select onChange={this.handleChange} name="role" value={role.role} disabled={disableEditing}>
            <option value="presenting_officer">Valmistelija</option>
            <option value="evaluator">Arvioija</option>
          </select>
        </td>
        <td className="haku-roles-name-column"><input type="text" value={role.name} name="name" onChange={this.handleChange}/></td>
        <td className="haku-roles-email-column">
          <input type="text" value={role.email || ""} name="email" onChange={this.handleChange}/>
          <button type="button" onClick={onDelete} className="remove haku-roles-remove" alt="Poista" title={removeTitleText} tabIndex="-1" disabled={disableEditing} />
        </td>
      </tr>
    )
  }
}
