import { Avustushaku, Hakemus } from "soresu-form/web/va/types";
import React from "react";
import moment from "moment";

import { LahetysStatuses, Role, VaCodeValue } from "../types";

import styles from "./AvustushakuDetails.module.less";

interface Props {
  avustushaku: Avustushaku;
  hakemusList: Hakemus[];
  vastuuvalmistelija: Role | undefined;
  lahetykset: LahetysStatuses;
  toimintayksikko?: VaCodeValue;
  earliestPaymentCreatedAt?: string;
}

export const AvustushakuDetails: React.FC<Props> = ({
  avustushaku,
  hakemusList,
  vastuuvalmistelija,
  lahetykset,
  toimintayksikko,
  earliestPaymentCreatedAt,
}) => {
  const acceptedHakemus = hakemusList.find(
    (h) => h.arvio.status === "accepted"
  );
  return (
    <div className={styles.detailsContainer}>
      <Box title="Toimintayksikkö">
        {toimintayksikko?.["code-value"] ?? "-"}
      </Box>
      <Box title="Vastuuvalmistelija">{vastuuvalmistelija?.name ?? "-"}</Box>
      <Box title="Päätökset">
        {lahetykset.paatoksetSentAt
          ? format(lahetykset.paatoksetSentAt)
          : "Ei lähetetty"}
      </Box>
      <Box title="Maksatukset">
        {earliestPaymentCreatedAt
          ? format(earliestPaymentCreatedAt)
          : "Ei lähetetty"}
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
      <Box title="Muutoshakukelpoinen">
        {avustushaku.muutoshakukelpoinen ? "Kyllä" : "Ei"}
      </Box>
      <Box title="Budjetti">
        {acceptedHakemus
          ? acceptedHakemus.arvio.useDetailedCosts
            ? "Menoluokittelu"
            : "Kokonaiskustannus"
          : "-"}
      </Box>
    </div>
  );
};

interface BoxProps {
  title: string;
  children: React.ReactNode;
}

const Box: React.FC<BoxProps> = ({ title, children }) => {
  return (
    <div className={styles.box}>
      <span className={styles.title}>{title}</span>
      <span data-test-id={`lisatiedot-${title}`}>{children}</span>
    </div>
  );
};

const format = (date: string) => moment(date).format("DD.MM.YYYY");

interface DeadlineProps {
  deadline?: string;
  sentAt?: string;
}

const Deadline: React.FC<DeadlineProps> = ({ deadline, sentAt }) => {
  if (!deadline) {
    return <>-</>;
  }
  if (!sentAt) {
    return (
      <>
        Ei lähetetty
        <span className={styles.deadline}>{` (DL ${format(deadline)})`}</span>
      </>
    );
  }
  return <>{format(sentAt)}</>;
};
