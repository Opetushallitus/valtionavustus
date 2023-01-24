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
  const taydennyspyyntoOdottaaVastausta =
    hakemusStatus === "pending_change_request";

  const taydennyspyyntoonVastattu =
    hakemukselleLahetettyTaydennyspyynto && !taydennyspyyntoOdottaaVastausta;

  return (
    <div className={styles.container}>
      {taydennyspyyntoOdottaaVastausta && (
        <div
          data-test-id={`taydennyspyynto-odottaa-vastausta-${hakemusId}`}
          className={ClassNames(styles.indikaattori, styles.odottaaVastausta)}
          title={"Täydennyspyyntö odottaa vastausta"}
        >
          T
        </div>
      )}
      {taydennyspyyntoonVastattu && (
        <div
          data-test-id={`taydennyspyyntoon-vastattu-${hakemusId}`}
          className={ClassNames(
            styles.indikaattori,
            styles.taydennyspyyntoonVastattu
          )}
          title={"Täydennyspyyntöön vastattu"}
        >
          T
        </div>
      )}
    </div>
  );
};
