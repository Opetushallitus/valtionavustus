import React, { Component } from 'react'

export default class HakuRoles extends Component {

  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const ldapSearchResults = this.props.ldapSearchResults
    const minimumSearchInputLength = 2
    const roles = avustushaku.roles
    const roleRows = []
    if(roles) {
      for (var i=0; i < roles.length; i++) {
        const role = roles[i]
        roleRows.push(<RoleRow key={role.id} role={role} avustushaku={avustushaku} controller={controller}/>)
      }
    }

    const startSearch = e => {
      const input = _.trim(e.target.value)
      if (input.length < minimumSearchInputLength) {
        return
      }
      controller.startLdapSearch(input)
    }

    // ldapSearchResults: { error: false, results: [], truncated: false }
    const searchErrorClass = ldapSearchResults.error ? "error" : "hidden"

    return (
      <div id="haku-roles">
        <table>
          <thead><tr><th>Rooli</th><th>Sidottu LDAPiin?</th><th>Nimi</th><th>Sähköposti</th></tr></thead>
          <tbody>
          {roleRows}
          </tbody>
        </table>

        <div id="add-new-person-from-ldap">
          <div className={searchErrorClass}>Virhe henkilön haussa. Yritä uudestaan eri hakuehdoilla ja lataa sivu uudestaan, jollei se auta.</div>
          <div className="person-adder-input">
            Lisää uusi henkilö
            <input type="text" placeholder={"Hae (vähintään " + minimumSearchInputLength + " merkkiä)"} onChange={startSearch}/>
            <PersonSelectList ldapSearchResults={ldapSearchResults} avustushaku={avustushaku} controller={controller} />
            <button onClick={controller.createRole(avustushaku)} disabled={!roles}>Lisää uusi henkilö</button>
          </div>
        </div>
      </div>
    )

  }
}

class PersonSelectList extends React.Component {
  render() {
    const ldapSearchResults = this.props.ldapSearchResults
    const avustushaku = this.props.avustushaku
    const controller = this.props.controller
    const personRows = _.map(ldapSearchResults.results, r => {
      const firstName = r["first-name"]
      const lastName = r["surname"]
      const email = r["email"]
      const oid = r["person-oid"]
      const name = firstName ? firstName + " "  + lastName : lastName
      const displayText = name + " <" + email + ">" + "(" + oid + ")"
      const newRole = { name: name, email: email, role: null, oid: oid }

      const addButton = <button onClick={controller.createRole(avustushaku, newRole)}>Lisää</button>

      return <li key={r["person-oid"]}>{addButton} {displayText}</li>
    })
    const searchResultClassName = ldapSearchResults.loading ? "loading" : undefined
    return <div id="ldap-search-results" className={searchResultClassName}>
               <ul>
                 {personRows}
               </ul>
           </div>
  }
}

class RoleRow extends React.Component {

  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.state = {changes: false}
  }

  handleChange(event) {
    this.props.role[event.target.name] = event.target.value
    this.setState({changes: true})
    this.props.controller.reRender()
  }

  handleBlur(event) {
    if(this.state.changes) {
      this.setState({changes: false})
      this.props.controller.saveRole(this.props.avustushaku, this.props.role)
    }
  }

  render() {
    const role = this.props.role
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const onDelete = controller.deleteRole(avustushaku, role)
    const hasOid = role.oid && role.oid.length > 0
    const oidStatusClass = hasOid ? undefined : "error"
    const oidStatusText = hasOid ? "Valtuutus OK" : "Ei valtuutettu"
    return (
      <tr>
        <td>
          <select onChange={this.handleChange} name="role" onBlur={this.handleBlur} value={role.role}>
            <option value="presenting_officer">Esittelijä</option>
            <option value="evaluator">Arvioija</option>
          </select>
        </td>
        <td className={oidStatusClass}>{oidStatusText}</td>
        <td>{role.name}</td>
        <td>{role.email}</td>
        <td><button onClick={onDelete} className="remove" alt="Poista" title="Poista" tabIndex="-1" /></td>
      </tr>
    )
  }
}
