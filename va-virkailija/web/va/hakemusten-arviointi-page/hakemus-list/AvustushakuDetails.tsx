import { Hakemus } from 'soresu-form/web/va/types'
import React from 'react'
import moment from 'moment'

import * as styles from './AvustushakuDetails.module.css'
import { AvustushakuData } from '../arviointiReducer'

type Props = AvustushakuData & {
  acceptedHakemus: Hakemus | undefined
}

export const AvustushakuDetails = ({
  acceptedHakemus,
  hakuData,
  lahetykset,
  earliestPaymentCreatedAt,
}: Props) => {
  const { avustushaku, toimintayksikko } = hakuData
  const vastuuvalmistelija = hakuData.roles.find((r) => r.role === 'vastuuvalmistelija')
  return (
    <div className={styles.detailsContainer}>
      <Box title="Toimintayksikkö">{toimintayksikko?.['code-value'] ?? '-'}</Box>
      <Box title="Vastuuvalmistelija">{vastuuvalmistelija?.name ?? '-'}</Box>
      <Box title="Päätökset">
        {lahetykset.paatoksetSentAt ? format(lahetykset.paatoksetSentAt) : 'Ei lähetetty'}
      </Box>
      <Box title="Maksatukset">
        {earliestPaymentCreatedAt ? format(earliestPaymentCreatedAt) : 'Ei lähetetty'}
      </Box>
      <Box title="Väliselvitykset">
        <Deadline
          deadline={avustushaku.valiselvitysdate}
          sentAt={lahetykset.valiselvitysPyynnostSentAt}
        />
      </Box>
      <Box title="Loppuselvitykset">
        <Deadline
          deadline={avustushaku.loppuselvitysdate}
          sentAt={lahetykset.loppuselvitysPyynnotSentAt}
        />
      </Box>
      <Box title="Muutoshakukelpoinen">{avustushaku.muutoshakukelpoinen ? 'Kyllä' : 'Ei'}</Box>
      <Box title="Budjetti">
        {acceptedHakemus
          ? acceptedHakemus.arvio.useDetailedCosts
            ? 'Menoluokittelu'
            : 'Kokonaiskustannus'
          : '-'}
      </Box>
    </div>
  )
}

interface BoxProps {
  title: string
  children: React.ReactNode
}

const Box: React.FC<BoxProps> = ({ title, children }) => {
  return (
    <div className={styles.box}>
      <span className={styles.title}>{title}</span>
      <span data-test-id={`lisatiedot-${title}`}>{children}</span>
    </div>
  )
}

const format = (date: string) => moment(date).format('DD.MM.YYYY')

interface DeadlineProps {
  deadline?: string
  sentAt?: string
}

const Deadline: React.FC<DeadlineProps> = ({ deadline, sentAt }) => {
  if (!deadline) {
    return <>-</>
  }
  if (!sentAt) {
    return (
      <>
        Ei lähetetty
        <span className={styles.deadline}>{` (DL ${format(deadline)})`}</span>
      </>
    )
  }
  return <>{format(sentAt)}</>
}
