import React from 'react'
import { Avustushaku } from 'soresu-form/web/va/types'

export const TutkiavustuksiaLatauslinkki = ({
  avustushaku,
}: {
  avustushaku: Avustushaku | undefined
}) => {
  if (!avustushaku || !avustushaku.id) return null

  return (
    <div className="excel-download-link">
      <a
        className="excel-export"
        href={`/api/avustushaku/${avustushaku.id}/hallinnoiavustuksia.xslx`}
        target="_"
      >
        Lataa siirtotiedosto
      </a>
    </div>
  )
}
