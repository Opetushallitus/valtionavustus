import React from 'react'
import { Hakemus } from 'soresu-form/web/va/types'
import HakemusListing from './HakemusListing'

const ShouldPayIcon = ({hakemus, show}: {hakemus: Hakemus, show: boolean}) => {
  if (!show) {
    return null
  }

  const shouldPayGrantIcon =
    HakemusListing._fieldGetter("should-pay")(hakemus)

  const hoverTextToShouldPay = hakemus.arvio["should-pay-comments"]

  const shouldPayTitle = hakemus.arvio["should-pay"] ? "" : "Ei makseta: " +
    hoverTextToShouldPay

  return (
    <span id="should-pay-notification"
          title={shouldPayTitle}>{shouldPayGrantIcon}</span>
  )
}

export default ShouldPayIcon
