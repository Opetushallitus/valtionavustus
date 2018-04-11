import Bacon from 'baconjs'
import React from 'react'

export default class ShouldPayComments extends React.Component {
  constructor(props){
    super(props)
    this.state={shouldPayComments: getShouldPayComments(this.props.hakemus)}
    this.shouldPayCommentsBus = new Bacon.Bus()
    this.shouldPayCommentsBus.debounce(1000).onValue(([hakemus, newshouldPayComment]) => this.props.controller.setHakemusShouldPayComments(hakemus, newshouldPayComment))
  }

 componentWillReceiveProps(nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.setState({shouldPayComments: getShouldPayComments(nextProps.hakemus)})
    }
  }

  commentsUpdated(newshouldPayComment){
    this.setState({shouldPayComments: newshouldPayComment})
    this.shouldPayCommentsBus.push([this.props.hakemus, newshouldPayComment])
}

  render() {
 return(
   <div className="value-edit should-pay-comment">
      <label htmlFor="should-pay-comment">Perustelut, miksi ei makseta: </label>
      <textarea id="should-pay-comment" rows="5" disabled={this.props.hakemus.arvio["should-pay"]} value={this.state.shouldPayComments || "" }
             onChange={evt => this.commentsUpdated(evt.target.value) } maxLength="128" />
    </div>
)
}

}

function getShouldPayComments(hakemus) {
  const arvio = hakemus.arvio || {}
  return arvio["should-pay-comments"]
}
