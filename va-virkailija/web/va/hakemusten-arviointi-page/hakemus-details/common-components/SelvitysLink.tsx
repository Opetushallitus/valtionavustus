import './SelvitysLink.css'

import React from 'react'
import { HelpTooltip } from '../../../common-components/HelpTooltip'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

type SelvitysLinkProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  selvitysType: 'valiselvitys' | 'loppuselvitys'
  helpTextKey: string
  selvitysPyynnotSent: boolean
}

export default function SelvitysLink({
  hakemus,
  avustushaku,
  selvitysType,
  helpTextKey,
  selvitysPyynnotSent,
}: SelvitysLinkProps) {
  const userKey = hakemus['user-key']
  const publicUrl = `/selvitys/avustushaku/${avustushaku.id}/${selvitysType}?hakemus=${userKey}`

  const warningText =
    'Huom! Mikäli jaat lomakelinkin yksittäiselle hankkeelle ennen selvityspyyntöjen lähettämistä, varmista että selvityslomakepohjaa ei tämän jälkeen enää muokata.'

  return (
    <span className="decision">
      {!selvitysPyynnotSent && <div id="selvitys-not-sent-warning">{warningText}</div>}
      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
        Linkki lomakkeelle
      </a>
      <HelpTooltip textKey={helpTextKey} direction={'arviointi'} />
    </span>
  )
}
