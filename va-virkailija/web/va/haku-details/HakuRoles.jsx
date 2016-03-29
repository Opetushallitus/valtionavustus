import React, { Component } from 'react'
import ClassNames from 'classnames'

import CSSTransitionGroup from 'soresu-form/web/form/component/wrapper/CSSTransitionGroup.jsx'
import LdapSearchParameters from './LdapSearchParameters'


export default class HakuRoles extends Component {
  render() {
    const {controller, avustushaku, userHasEditPrivilege, ldapSearch, userInfo} = this.props
    const roles = _.sortBy(avustushaku.roles, 'name')
    const roleRows = roles ? roles.map(role => <RoleRow key={role.id} role={role} avustushaku={avustushaku} userInfo={userInfo} userHasEditPrivilege={userHasEditPrivilege} controller={controller}/>) : []

    const startSearch = e => {
      const input = _.trim(e.target.value)
      controller.startLdapSearch(input)
    }

    const searchErrorClass = ldapSearch.result.error ? "error" : "hidden"
    const hasInput = ldapSearch.input.length > 0
    const clearInputButtonClassname = ClassNames("remove", { enabled: hasInput })

    return (
      <div id="haku-roles">
        <table>
          <thead><tr><th>Rooli</th><th>Sidottu LDAPiin?</th><th>Nimi</th><th>Sähköposti</th></tr></thead>
          <CSSTransitionGroup transitionName="haku-roles-transition" component="tbody">
          {roleRows}
          </CSSTransitionGroup>
        </table>

        <div id="add-new-person-from-ldap">
          <div className="ldap-error-display"><span className={searchErrorClass}>Virhe henkilön haussa. Yritä uudestaan eri hakuehdoilla ja lataa sivu uudestaan, jollei se auta.</span></div>
          <div className="person-adder-input">
            Lisää uusi henkilö
            <input id="ldap-search-input" type="text" placeholder={"Hae"} onChange={startSearch} disabled={!roles || !userHasEditPrivilege}/>
            <button type="button" className={clearInputButtonClassname} title="Tyhjennä" disabled={!hasInput} onClick={(e) => {
                const ldapSearchInput = document.getElementById('ldap-search-input')
                ldapSearchInput.value = ''
                startSearch(e)
              }} />
            <PersonSelectList ldapSearch={ldapSearch} avustushaku={avustushaku} controller={controller} />
          </div>
        </div>
      </div>
    )

  }
}

class PersonSelectList extends React.Component {
  render() {
    const {ldapSearch, avustushaku, controller} = this.props
    const personRows = _.map(ldapSearch.result.results, r => {
      const firstName = r["first-name"]
      const lastName = r["surname"]
      const email = r["email"]
      const oid = r["person-oid"]
      const name = firstName ? firstName + " "  + lastName : lastName
      const newRole = { name: firstAndLast(name), email: email, role: null, oid: oid }
      const accessLevel = userDetailsToClassAndFi(r)
      const displayText = name + " (" + email + ", "

      const personIsInRolesAlready = _.some(avustushaku.roles, r => { return r.oid === oid })
      const titleText = (name + " <" + email + ">" + "(" + accessLevel.description + ", oid " + oid + ")") +
        (personIsInRolesAlready ? " (Käyttäjä on jo lisätty avustushakuun)" : "")
      const onClick = e => {
        e.preventDefault()
        if (!personIsInRolesAlready) {
          controller.createRole(avustushaku, newRole)()
        }
      }

      return <li key={r["person-oid"]} title={titleText} className={personIsInRolesAlready ? "disabled" : null}>
               <a href="#" onClick={onClick} className={personIsInRolesAlready ? "disabled" : null}>
                 <span className="person-description">{displayText}</span>
                 <span className={"access-level " + accessLevel.className}>{accessLevel.description + ")"}</span>
               </a>
             </li>
    })
    const resultRows = personRows.length === 0 ? [ <li key="no-results-row" className="no-results-row">Ei hakutuloksia.</li>] : personRows
    const searchResultClassNames = ClassNames(undefined, { loading: ldapSearch.loading,
                                                           hidden: ldapSearch.input.length < LdapSearchParameters.minimumSearchInputLength() })
    return <div id="ldap-search-results" className={searchResultClassNames}>
               <ul className={searchResultClassNames}>
                 {resultRows}
               </ul>
           </div>


    function userDetailsToClassAndFi(userDetails) {
      if (userDetails["va-admin"]) {
        return { className: "va-admin", description: "VA-pääkäyttäjä" }
      }
      if (userDetails["va-user"]) {
        return { className: "va-user", description: "VA-käyttäjä" }
      }
      return { className: "no-va-access", description: "Ei VA-oikeuksia" }
    }

    function firstAndLast(fullName) {
      const splitted = fullName.split(' ')
      return splitted[0] + ' ' + splitted.pop()
    }
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
    const hasOid = role.oid && role.oid.length > 0
    const oidStatusClass = hasOid ? undefined : "error"
    const oidStatusText = hasOid ? "Valtuutus OK" : "Ei valtuutettu"
    return (
      <tr>
        <td>
          <select onChange={this.handleChange} name="role" value={role.role} disabled={disableEditing}>
            <option value="presenting_officer">Esittelijä</option>
            <option value="evaluator">Arvioija</option>
          </select>
        </td>
        <td className={oidStatusClass}>{oidStatusText}</td>
        <td><input type="text" value={role.name} name="name" onChange={this.handleChange}/></td>
        <td>{role.email}</td>
        <td><button type="button" onClick={onDelete} className="remove" alt="Poista" title={removeTitleText} tabIndex="-1" disabled={disableEditing} /></td>
      </tr>
    )
  }
}
