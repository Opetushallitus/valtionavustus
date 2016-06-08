import React, {Component} from 'react'
import PresenterComment from './PresenterComment.jsx'

export default class Seuranta extends Component {

  render() {
    const {controller, hakemus} = this.props
    return (
      <div>
        <PresenterComment controller={controller} hakemus={hakemus}/>
      </div>
    )
  }
}