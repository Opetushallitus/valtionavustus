import React from "react";
import ClassNames from "classnames";
import { HakemusStatus } from "soresu-form/web/va/types";
import styles from "./TaydennyspyyntoIndikaattori.module.less";

export const TaydennyspyyntoIndikaattori = ({
  hakemusId,
  hakemusStatus,
  hakemukselleLahetettyTaydennyspyynto,
}: {
  hakemusId: number;
  hakemusStatus: HakemusStatus;
  hakemukselleLahetettyTaydennyspyynto: boolean;
}) => {
  if (!hakemukselleLahetettyTaydennyspyynto) {
    return <div className={styles.container}></div>;
  }

  const taydennyspyyntoOdottaaVastausta =
    hakemusStatus === "pending_change_request";

  const testId = taydennyspyyntoOdottaaVastausta
    ? `taydennyspyynto-odottaa-vastausta-${hakemusId}`
    : `taydennyspyyntoon-vastattu-${hakemusId}`;

  const vastausStyle = taydennyspyyntoOdottaaVastausta
    ? styles.odottaaVastausta
    : styles.taydennyspyyntoonVastattu;

  const vastausTitle = taydennyspyyntoOdottaaVastausta
    ? "Täydennyspyyntö odottaa vastausta"
    : "Täydennyspyyntöön vastattu";

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
  );
};
