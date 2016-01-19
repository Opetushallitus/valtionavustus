import React from 'react'
import Bowser from 'bowser'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import LocalizedLink from 'soresu-form/web/form/component/LocalizedLink.jsx'

export default class VaOldBrowserWarning extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: VaOldBrowserWarning.isBrowserOutdated(this.props.devel)  }
    this.hideClick = this.hideClick.bind(this)
  }

  static isBrowserOutdated(devel) {
    const browser = Bowser.browser
    return (browser.msie && browser.version <= 9) || devel

  }

  hideClick() {
    this.setState({ show: false })
  }

  render() {
    if(this.state.show) {
      return <div className="va-old-browser-warning">
               <div className="text">
                 <LocalizedString translations={this.props.translations}
                                  translationKey="old-browser"
                                  lang={this.props.lang} />
                 <LocalizedLink translations={this.props.translations}
                                translationKey="old-browser-update-link-text"
                                linkKey="old-browser-update-link"
                                target="_blank"
                                lang={this.props.lang} />
               </div>
               <button type="button" className="soresu-remove" onClick={this.hideClick} />
             </div>

    }
    return <div className="va-old-browser-warning hidden"></div>
  }
}
