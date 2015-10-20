import _ from 'lodash'
import React from 'react'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'

export default class VaHakemusRegisterNumber extends React.Component {
  render() {
    if(!_.isNull(this.props.registerNumber)) {
      const registerNumber = this.props.registerNumber
      return <section className="va-register-number">
               <span className="title">
                 <LocalizedString translations={this.props.translations.misc}
                                  translationKey="register-number"
                                  lang={this.props.lang} />:
                </span>
                <span className="value">{registerNumber}</span>
             </section>

    }
    return <div className="va-register-number hidden"></div>
  }
}
