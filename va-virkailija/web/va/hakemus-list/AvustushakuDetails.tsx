import {Avustushaku} from "soresu-form/web/va/types";
import React from "react";
import moment from "moment";

import {LahetysStatuses, Role, VaCodeValue} from "../types";

import styles from './AvustushakuDetails.module.less'

interface Props {
  avustushaku: Avustushaku
  vastuuvalmistelija: Role | undefined
  lahetykset: LahetysStatuses
  toimintayksikko?: VaCodeValue
  earliestPaymentCreatedAt?: string
}

export const AvustushakuDetails: React.FC<Props> = ({avustushaku, vastuuvalmistelija, lahetykset, toimintayksikko, earliestPaymentCreatedAt}) => {
  return (
    <div className={styles.detailsContainer}>
      <Box title="Toimintayksikkö">
        <span data-test-id="lisatiedot-toimintayksikko">{toimintayksikko?.["code-value"] ?? '-'}</span>
      </Box>
      <Box title="Vastuuvalmistelija">
        <span data-test-id="lisatiedot-vastuuvalmistelija">{vastuuvalmistelija?.name ?? '-'}</span>
      </Box>
      <Box title="Päätökset">
        <span data-test-id="lisatiedot-paatokset">{lahetykset.paatoksetSentAt ? format(lahetykset.paatoksetSentAt) : 'Ei lähetetty'}</span>
      </Box>
      <Box title="Maksatukset">
        <span data-test-id="lisatiedot-maksatukset">{earliestPaymentCreatedAt ? format(earliestPaymentCreatedAt) : 'Ei lähetetty'}</span>
      </Box>
      <Box title="Väliselvitykset">
        <Deadline dataTestId="lisatiedot-valiselvitykset" deadline={avustushaku.valiselvitysdate} sentAt={lahetykset.valiselvitysPyynnostSentAt} />
      </Box>
      <Box title="Loppuselvitykset">
        <Deadline dataTestId="lisatiedot-loppuselvitykset" deadline={avustushaku.loppuselvitysdate} sentAt={lahetykset.loppuselvitysPyynnotSentAt} />
      </Box>
      <Box title="Muutoshakukelpoinen">
        <span data-test-id="lisatiedot-muutoshakukelpoinen">{avustushaku.muutoshakukelpoinen ? 'Kyllä' : 'Ei'}</span>
      </Box>
    </div>
  )
}

interface BoxProps {
  title: string
}

const Box: React.FC<BoxProps> = ({title, children}) => {
  return (
    <div className={styles.box}>
      <span className={styles.title}>{title}</span>
      {children}
    </div>
  )
}

const format = (date: string) => moment(date).format('DD.MM.YYYY')

interface DeadlineProps {
  deadline?: string
  sentAt?: string
  dataTestId: string
}

const Deadline: React.FC<DeadlineProps> = ({deadline, sentAt, dataTestId}) => {
  if (!deadline) {
    return <span data-test-id={dataTestId}>-</span>
  }
  if (!sentAt) {
    return (
      <span data-test-id={dataTestId}>Ei lähetetty
        <span className={styles.deadline}>
          {` (DL ${format(deadline)})`}
        </span>
      </span>
    )
  }
  return <span data-test-id={dataTestId}>{format(sentAt)}</span>
}
