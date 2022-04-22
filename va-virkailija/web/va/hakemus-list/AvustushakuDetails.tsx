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
}

export const AvustushakuDetails: React.FC<Props> = ({avustushaku, vastuuvalmistelija, lahetykset, toimintayksikko}) => {
  return (
    <div className={styles.detailsContainer}>
      <Box title="Toimintayksikkö">
        <span>{toimintayksikko?.["code-value"] ?? '-'}</span>
      </Box>
      <Box title="Vastuuvalmistelija">
        <span>{vastuuvalmistelija?.name ?? '-'}</span>
      </Box>
      <Box title="Päätökset">
        <span>{lahetykset.paatoksetSentAt ? format(lahetykset.paatoksetSentAt) : 'Ei lähetetty'}</span>
      </Box>
      <Box title="Maksatukset"/>
      <Box title="Väliselvitykset">
        <Deadline deadline={avustushaku.valiselvitysdate} sentAt={lahetykset.valiselvitysPyynnostSentAt} />
      </Box>
      <Box title="Loppuselvitykset">
        <Deadline deadline={avustushaku.loppuselvitysdate} sentAt={lahetykset.loppuselvitysPyynnotSentAt} />
      </Box>
      <Box title="Muutoshakukelpoinen">
        <span>{avustushaku.muutoshakukelpoinen ? 'Kyllä' : 'Ei'}</span>
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

const Deadline: React.FC<{deadline?: string, sentAt?: string}> = ({deadline, sentAt}) => {
  if (!deadline) {
    return <span>-</span>
  }
  if (!sentAt) {
    return (
      <React.Fragment>
        <span>Ei lähetetty<span className={styles.deadline}>{` (DL ${format(deadline)})`}</span></span>
      </React.Fragment>
    )
  }
  return <span>Lähetetty {format(sentAt)}</span>
}
