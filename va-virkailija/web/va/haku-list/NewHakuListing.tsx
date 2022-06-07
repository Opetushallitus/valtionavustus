import React, { useState } from "react";

import useOutsideClick from "../useOutsideClick";
import classNames from "classnames";
import {
  Avustushaku,
  AVUSTUSHAKU_PHASES,
  AVUSTUSHAKU_STATUSES,
  AvustushakuPhase,
  AvustushakuStatus,
} from "soresu-form/web/va/types";
import { Pill } from "../hakemus-list/Pill";
import moment from "moment-timezone";
import { SelectedAvustushaku } from "../HakujenHallintaController";

import buttonStyles from "../hakemus-list/Button.module.less";
import styles from "./NewHakuListing.module.less";

interface TableLabelProps {
  text: string;
  disabled?: boolean;
  showDeleteButton?: {
    ariaLabel: string;
    onClick: () => void;
  };
}

const TableLabel: React.FC<TableLabelProps> = ({
  text,
  disabled,
  showDeleteButton,
  children,
}) => {
  const [toggled, toggleMenu] = useState(false);
  const onOutsideClick = () => toggleMenu((value) => !value);
  const ref = useOutsideClick<HTMLDivElement>(onOutsideClick);
  return (
    <div className={styles.tableLabel}>
      <button
        disabled={!!disabled}
        onClick={() => toggleMenu((state) => !state)}
        className={classNames(styles.tableLabelButton, {
          [buttonStyles.selected]: toggled,
        })}
      >
        {text}
      </button>
      {showDeleteButton && (
        <button
          className={buttonStyles.deleteButton}
          onClick={showDeleteButton.onClick}
          aria-label={showDeleteButton.ariaLabel}
        />
      )}
      {toggled && (
        <div className={styles.tableLabelPopup} ref={ref}>
          {children}
        </div>
      )}
    </div>
  );
};

type Statuses = AvustushakuStatus | AvustushakuPhase;

interface StatusTableLabelProps<Status extends Statuses>
  extends TableLabelProps {
  statuses: readonly Status[];
  labelText: (status: Status) => string;
  isChecked: (status: Status) => boolean;
  onCheck: (status: Status) => void;
  onUncheck: (status: Status) => void;
  amountOfStatus: (status: Status) => number;
}

function StatusTableLabel<Status extends Statuses>({
  statuses,
  labelText,
  text,
  isChecked,
  onCheck,
  onUncheck,
  amountOfStatus,
  showDeleteButton,
}: StatusTableLabelProps<Status>) {
  return (
    <TableLabel text={text} showDeleteButton={showDeleteButton}>
      {statuses.map((status) => {
        const checked = isChecked(status);
        return (
          <div
            key={`muutoshakemus-status-${status}`}
            className={styles.statusCheckbox}
          >
            <input
              type="checkbox"
              id={status}
              checked={checked}
              onChange={() => {
                if (checked) {
                  onUncheck(status);
                } else {
                  onCheck(status);
                }
              }}
            />
            <label htmlFor={status}>
              {labelText(status)} ({amountOfStatus(status)})
            </label>
          </div>
        );
      })}
    </TableLabel>
  );
}

const TableHeader: React.FC = ({ children }) => (
  <th>
    <div className={styles.tableHeader}>{children}</div>
  </th>
);

interface Props {
  hakuList: Avustushaku[];
  selectedHaku: SelectedAvustushaku;
  onClickHaku: (avustushaku: Avustushaku) => void;
}

const toShortDate = (date: Date | string) => moment(date).format("DD.MM.YY");

export const NewHakuListing: React.FC<Props> = ({
  hakuList,
  selectedHaku,
  onClickHaku,
}) => {
  const filteredList = hakuList;
  return (
    <div className={styles.containerForModals}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <colgroup>
            <col style={{ maxWidth: "400px" }} />
          </colgroup>
          <thead>
            <tr>
              <TableHeader>
                <input
                  placeholder="Avustushaku"
                  onChange={() => {}}
                  value={""}
                />
              </TableHeader>
              <TableHeader>
                <StatusTableLabel
                  text="Tila"
                  statuses={AVUSTUSHAKU_STATUSES}
                  labelText={(status) => StatusToFi[status]}
                  isChecked={() => false}
                  onCheck={() => {}}
                  onUncheck={() => {}}
                  amountOfStatus={() => 0}
                  showDeleteButton={undefined}
                />
              </TableHeader>
              <TableHeader>
                <StatusTableLabel
                  text="Vaihe"
                  statuses={AVUSTUSHAKU_PHASES}
                  labelText={(phase) => PhaseToFi[phase]}
                  isChecked={() => false}
                  onCheck={() => {}}
                  onUncheck={() => {}}
                  amountOfStatus={() => 0}
                  showDeleteButton={undefined}
                />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Hakuaika" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Päätös" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Maksatus" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Väliselvitys" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Loppuselvitys" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Väliselvitykset" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="V.Valmistelija" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Muutoshakukelpoinen" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Budjetti" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Käyttöaika alkaa" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Käyttöaika päättyy" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Jaossa ollut summa €" disabled />
              </TableHeader>
              <TableHeader>
                <TableLabel text="Maksettu summa €" disabled />
              </TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((avustushaku) => {
              const { start, end } = avustushaku.content.duration;
              const startEnd =
                start && end
                  ? `${toShortDate(start)} - ${toShortDate(end)}`
                  : "-";
              return (
                <tr
                  key={avustushaku.id}
                  className={classNames(
                    selectedHaku.id === avustushaku.id
                      ? styles.selectedHakemusRow
                      : styles.hakemusRow
                  )}
                  onClick={() => onClickHaku(avustushaku)}
                  tabIndex={0}
                >
                  <td className={styles.longTextTd}>
                    <span>{avustushaku.content.name.fi}</span>
                  </td>
                  <td>
                    <StatusPill status={avustushaku.status} />
                  </td>
                  <td>
                    <PhasePill phase={avustushaku.phase} />
                  </td>
                  <td>{startEnd}</td>
                  <td>
                    {
                      // TODO: get päätös date
                    }
                  </td>
                  <td>
                    {
                      // TODO: get maksatukset date
                    }
                  </td>
                  <td>
                    {avustushaku.valiselvitysdate
                      ? toShortDate(avustushaku.valiselvitysdate)
                      : "-"}
                  </td>
                  <td>
                    {avustushaku.loppuselvitysdate
                      ? toShortDate(avustushaku.loppuselvitysdate)
                      : "-"}
                  </td>
                  <td>
                    {
                      // TODO: get väliselvityskset date
                    }
                  </td>
                  <td>
                    {
                      // TODO: put V.Valmistelija here
                    }
                  </td>
                  <td>{avustushaku.muutoshakukelpoinen ? "Kyllä" : "Ei"}</td>
                  <td>
                    {
                      // TODO: get is menokohtainen or kokonaiskustannus
                    }
                  </td>
                  <td>
                    {avustushaku["hankkeen-alkamispaiva"]
                      ? toShortDate(avustushaku["hankkeen-alkamispaiva"])
                      : "-"}
                  </td>
                  <td>
                    {avustushaku["hankkeen-paattymispaiva"]
                      ? toShortDate(avustushaku["hankkeen-paattymispaiva"])
                      : "_"}
                  </td>
                  <td className={styles.alignRight}>
                    {
                      // TODO: get jaossa ollut summa €
                    }
                  </td>
                  <td className={styles.alignRight}>
                    {
                      // TODO: get maksettu summa €
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={8}>
                Näytetään {filteredList.length}/{hakuList.length} hakua
              </td>
              <td colSpan={8}>
                <a href="/api/avustushaku/export.xlsx">
                  Lataa excel ({hakuList.length} hakua)
                </a>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const StatusToFi = {
  draft: "Luonnos",
  new: "Uusi",
  resolved: "Ratkaistu",
  deleted: "Poistettu",
  published: "Julkaistu",
} as const;

const StatusToColor = {
  draft: "yellow",
  new: "blue",
  resolved: "red",
  deleted: "grey",
  published: "green",
} as const;

const StatusPill: React.FC<{ status: AvustushakuStatus }> = ({ status }) => (
  <Pill color={StatusToColor[status]} text={StatusToFi[status]} />
);

const PhaseToFi = {
  upcoming: "Aukeamassa",
  current: "Auki",
  unpublished: "Kiinni",
  ended: "Päättynyt",
} as const;

const PhaseToColor = {
  upcoming: "yellow",
  current: "green",
  unpublished: "red",
  ended: "red",
} as const;

const PhasePill: React.FC<{ phase: AvustushakuPhase }> = ({ phase }) => (
  <Pill color={PhaseToColor[phase]} text={PhaseToFi[phase]} />
);
