import React from 'react'
import ClassNames from 'classnames'
import * as styles from './TaydennyspyyntoIndikaattori.module.css'

export const TaydennyspyyntoIndikaattori = ({
  hakemusId,
  pendingChangeRequest,
  hakemukselleLahetettyTaydennyspyynto,
}: {
  hakemusId: number
  pendingChangeRequest: boolean
  hakemukselleLahetettyTaydennyspyynto: boolean
}) => {
  if (!hakemukselleLahetettyTaydennyspyynto) {
    return <div className={styles.container}></div>
  }

  const testId = pendingChangeRequest
    ? `taydennyspyynto-odottaa-vastausta-${hakemusId}`
    : `taydennyspyyntoon-vastattu-${hakemusId}`

  const vastausStyle = pendingChangeRequest
    ? styles.odottaaVastausta
    : styles.taydennyspyyntoonVastattu

  const vastausTitle = pendingChangeRequest
    ? 'Täydennyspyyntö odottaa vastausta'
    : 'Täydennyspyyntöön vastattu'

  return (
    <div className={styles.container}>
      <div
        data-test-id={testId}
        className={ClassNames(styles.indikaattori, vastausStyle)}
        title={vastausTitle}
      >
        T
      </div>
    </div>
  )
}
