import React, { Component } from 'react'

export default class HakuRoles extends Component {

  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const roles = avustushaku.roles
    const roleRows = []
    if(roles) {
      for (var i=0; i < roles.length; i++) {
        const role = roles[i]
        const htmlId = "role-" + role.id + "-"
        roleRows.push(
            <tr key={role.id}>
              <td>
                <select id={htmlId + "role"} value={role.role}>
                  <option value="presenting_officer">Esittelijä</option>
                  <option value="evaluator">Arvioija</option>
                </select>
              </td>
              <td><input type="text" id={htmlId + "name"} value={role.name}/></td>
              <td><input type="text" id={htmlId + "email"} value={role.email}/></td>
              <td><button className="remove" alt="Poista" title="Poista" tabIndex="-1" /></td>
            </tr>
        )
      }
    }

    return (
      <table id="haku-roles">
        <thead><tr><th>Rooli</th><th>Nimi</th><th>Sähköposti</th></tr></thead>
        <tbody>
        {roleRows}
        </tbody>
        <tfoot><tr><td><button>Lisää uusi henkilö</button></td></tr></tfoot>
      </table>
    )

  }
}
