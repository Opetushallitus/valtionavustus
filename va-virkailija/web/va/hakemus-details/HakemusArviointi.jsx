import React, { Component } from 'react'

import HakemusComments from './HakemusComments.jsx'
import HakemusStatus from "./HakemusStatus.jsx"
import HakemusHakijaSidePreviewLink from './HakemusHakijaSidePreviewLink.jsx'

export default class HakemusArviointi extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const comments = hakemus.comments
    const loadingComments = this.props.loadingComments
    return (
     <div id="hakemus-arviointi">
       <HakemusComments controller={controller} hakemus={hakemus} comments={comments} loadingComments={loadingComments}/>
       <SetStatus controller={controller} hakemus={hakemus} />
       <HakemusHakijaSidePreviewLink hakemus={hakemus} avustushaku={avustushaku} />
     </div>
    )
  }
}

class SetStatus extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    const arvio = hakemus.arvio
    const status = arvio ? arvio.status : undefined
    const controller = this.props.controller
    const statuses = []
    const statusValues = ['unhandled', 'plausible', 'rejected', 'accepted'];
    for (var i=0; i < statusValues.length; i++) {
      const htmlId = "set-status-" + statusValues[i]
      statuses.push(
          <input id={htmlId}
                 type="radio"
                 key={htmlId}
                 name="status"
                 value={statusValues[i]}
                 onChange={controller.setHakemusArvioStatus(hakemus, statusValues[i])}
                 checked={statusValues[i] === status ? true: null}
              />
      )
      statuses.push(
          <label key={htmlId + "-label"}
                 htmlFor={htmlId}>
            <HakemusStatus status={statusValues[i]}/>
          </label>
      )
    }

    return (
      <div>
        <h2>Tila</h2>
        {statuses}
      </div>
    )
  }
}
