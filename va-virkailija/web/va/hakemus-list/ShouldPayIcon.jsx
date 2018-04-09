import React from 'react'
import _ from 'lodash'
import HakemusListing from './HakemusListing.jsx'

const ShouldPayIcon = ({hakemus, show, state, controller}) => {
  if (!show) {
    return <span/>
  }

  const shouldPayGrantIcon =  HakemusListing._fieldGetter("should-pay")(hakemus)
  const hoverTextToShouldPay = hakemus.arvio["should-pay-comments"]
  const shouldPayTitle = hakemus.arvio["should-pay"] ? "" : "Ei makseta: " + hoverTextToShouldPay

  return (
      <span id="should-pay-notification" title={shouldPayTitle}>{shouldPayGrantIcon}</span>
  )
}


export default ShouldPayIcon
