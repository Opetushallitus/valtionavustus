import React from "react";
import { HakemusStatus } from "soresu-form/web/va/types";

import styles from "./TaydennyspyyntoIndikaattori.module.less";

export const TaydennyspyyntoIndikaattori = ({
  hakemusId,
  hakemusStatus,
}: {
  hakemusId: number;
  hakemusStatus: HakemusStatus;
}) => {
  const taydennyspyyntoOdottaaVastausta =
    hakemusStatus === "pending_change_request";

  return (
    <div className={styles.container}>
      {taydennyspyyntoOdottaaVastausta && (
        <div
          data-test-id={`taydennyspyynto-odottaa-vastausta-${hakemusId}`}
          className={styles.odottaaVastausta}
          title={"Täydennyspyyntö odottaa vastausta"}
        >
          T
        </div>
      )}
    </div>
  );
};
