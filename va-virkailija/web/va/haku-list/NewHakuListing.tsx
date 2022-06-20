import React, { useCallback, useState } from "react";

import useOutsideClick from "../useOutsideClick";
import classNames from "classnames";
import {
  AVUSTUSHAKU_PHASES,
  AVUSTUSHAKU_STATUSES,
  AvustushakuPhase,
  AvustushakuStatus,
} from "soresu-form/web/va/types";
import { Pill } from "../hakemus-list/Pill";
import moment from "moment-timezone";
import { SelectedAvustushaku, Avustushaku } from "../HakujenHallintaController";

import buttonStyles from "../style/Button.module.less";
import styles from "./NewHakuListing.module.less";

const SORTING_KEYS = [
  "avustushaku",
  "status",
  "phase",
  "hakuaika",
  "paatos",
  "maksatukset",
  "valiselvitykset",
  "loppuselvitykset",
  "valmistelija",
  "budjetti",
  "muutoshakukelpoinen",
  "kayttoaikaAlkaa",
  "kayttoaikaPaattyy",
  "jaossaOllutSumma",
  "maksettuSumma",
] as const;

type SortOrder = "asc" | "desc";

type SortKey = typeof SORTING_KEYS[number];

type SorterMap = {
  [k in SortKey]: (h: Avustushaku) => number | string;
};

interface SortContext {
  setSorting: (sortKey: SortKey) => void;
  sortingState: SortState;
}

const SortStateContext = React.createContext<SortContext | undefined>(
  undefined
);

interface SortState {
  sortKey: SortKey | undefined;
  sortOrder: SortOrder;
}

const sortValueMap: SorterMap = {
  avustushaku: (a) => a.content.name.fi,
  status: (a) => StatusToFi[a.status],
  phase: (a) => PhaseToFi[a.phase],
  hakuaika: (a) => new Date(a.content.duration.end).getTime(),
  paatos: (a) => a["paatokset-lahetetty"] ?? "zzz",
  maksatukset: (a) => a["maksatukset-lahetetty"] ?? "zzz",
  valiselvitykset: (a) =>
    a["valiselvitykset-lahetetty"] ?? a.valiselvitysdate ?? "zzz",
  loppuselvitykset: (a) =>
    a["loppuselvitykset-lahetetty"] ?? a.loppuselvitysdate ?? "zzz",
  valmistelija: (a) => a.vastuuvalmistelija ?? "zzz",
  muutoshakukelpoinen: (a) => (a.muutoshakukelpoinen ? 1 : 0),
  budjetti: () => "zzz", // TODO: implement with budjetti
  kayttoaikaAlkaa: (a) => a["hankkeen-alkamispaiva"] ?? "zzz",
  kayttoaikaPaattyy: (a) => a["hankkeen-paattymispaiva"] ?? "zzz",
  jaossaOllutSumma: (a) => a.content["total-grant-size"] ?? "zzz",
  maksettuSumma: (a) => a["maksatukset-summa"] ?? "zzz",
};

const avustushakuSorter =
  ({ sortKey, sortOrder }: SortState) =>
  (a: Avustushaku, b: Avustushaku): number => {
    const sortOrderCoef = sortOrder === "asc" ? -1 : 1;
    const sortResult =
      sortKey && sortValueMap[sortKey](a) > sortValueMap[sortKey](b) ? 1 : -1;
    return sortOrderCoef * sortResult;
  };

const useSorting = () => {
  const context = React.useContext(SortStateContext);
  if (context === undefined) {
    throw new Error("useShorting should be used within a SortStateProvider");
  }
  return context;
};

interface SortButtonProps {
  sortKey: SortKey;
  text: string;
}

const SortButton = ({ sortKey, text }: SortButtonProps) => {
  const { sortingState, setSorting } = useSorting();
  const isCurrentSortKey = sortKey === sortingState.sortKey;
  const isDesc = isCurrentSortKey && sortingState.sortOrder === "desc";
  const ariaLabel = `Järjestä ${text} ${
    isDesc ? "nousevaan" : "laskevaan"
  } järjestykseen`;
  return (
    <button
      aria-label={ariaLabel}
      className={buttonStyles.transparentButton}
      onClick={() => setSorting(sortKey)}
      data-test-id={`sort-button-${sortKey}`}
    >
      <svg
        width="12px"
        height="12px"
        viewBox="0 0 8 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.86603 6.5C4.48113 7.16667 3.51887 7.16667 3.13397 6.5L0.535899 2C0.150999 1.33333 0.632123 0.499999 1.40192 0.499999L6.59808 0.5C7.36788 0.5 7.849 1.33333 7.4641 2L4.86603 6.5Z"
          fill={isCurrentSortKey ? "#499CC7" : "#C1C1C1"}
          transform={isDesc ? "scale(1, -1) translate(0, -8)" : ""}
        />
      </svg>
    </button>
  );
};

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
  onToggle: (status: Status, isChecked: boolean) => void;
  amountOfStatus: (status: Status) => number;
}

function StatusTableLabel<Status extends Statuses>({
  statuses,
  labelText,
  text,
  isChecked,
  onToggle,
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
                onToggle(status, checked);
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

const GreenCheckIcon = () => (
  <svg
    width="21"
    height="20"
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0.5" width="20" height="20" rx="10" fill="#DCF8E7" />
    <path
      d="M15.0576 5.62012L8.37988 12.2979L5.94238 9.83496C5.81543 9.7334 5.6123 9.7334 5.51074 9.83496L4.77441 10.5713C4.67285 10.6729 4.67285 10.876 4.77441 11.0029L8.17676 14.3799C8.30371 14.5068 8.48145 14.5068 8.6084 14.3799L16.2256 6.7627C16.3271 6.66113 16.3271 6.45801 16.2256 6.33105L15.4893 5.62012C15.3877 5.49316 15.1846 5.49316 15.0576 5.62012Z"
      fill="#108046"
    />
  </svg>
);

const RedXIcon = () => (
  <svg
    width="21"
    height="20"
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0.5" width="20" height="20" rx="10" fill="#FFF3F2" />
    <path
      d="M11.7061 9.9873L14.4482 7.27051C14.6006 7.11816 14.6006 6.83887 14.4482 6.68652L13.8135 6.05176C13.6611 5.89941 13.3818 5.89941 13.2295 6.05176L10.5127 8.79395L7.77051 6.05176C7.61816 5.89941 7.33887 5.89941 7.18652 6.05176L6.55176 6.68652C6.39941 6.83887 6.39941 7.11816 6.55176 7.27051L9.29395 9.9873L6.55176 12.7295C6.39941 12.8818 6.39941 13.1611 6.55176 13.3135L7.18652 13.9482C7.33887 14.1006 7.61816 14.1006 7.77051 13.9482L10.5127 11.2061L13.2295 13.9482C13.3818 14.1006 13.6611 14.1006 13.8135 13.9482L14.4482 13.3135C14.6006 13.1611 14.6006 12.8818 14.4482 12.7295L11.7061 9.9873Z"
      fill="#BA3E35"
    />
  </svg>
);

const GoodBadDate: React.FC<{ goodDate?: string; badDate?: string }> = ({
  goodDate,
  badDate,
}) => {
  const date = goodDate ? goodDate : badDate;
  const shortDate = date && toShortDate(date);
  const icon = goodDate ? <GreenCheckIcon /> : <RedXIcon />;
  return (
    <div className={styles.goodBadDate}>
      {shortDate ? icon : null}
      <span>{shortDate ?? "-"}</span>
    </div>
  );
};

const TableHeader: React.FC<SortButtonProps> = ({
  sortKey,
  text,
  children,
}) => (
  <th>
    <div className={styles.tableHeader}>
      {children}
      <SortButton sortKey={sortKey} text={text} />
    </div>
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
  const [sortKey, setSortKey] = useState<SortKey | undefined>();
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [hakuNameFilter, setHakuNameFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<AvustushakuStatus[]>(() => [
    ...AVUSTUSHAKU_STATUSES,
  ]);
  const [phaseFilter, setPhaseFilter] = useState<AvustushakuPhase[]>(() => [
    ...AVUSTUSHAKU_PHASES,
  ]);
  const setSorting = useCallback(
    (newSortKey?: SortKey) => {
      if (sortKey === newSortKey) {
        setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(newSortKey);
        setSortOrder("asc");
      }
    },
    [sortKey]
  );
  const value = { sortingState: { sortOrder, sortKey }, setSorting };
  const filteredList = hakuList
    .filter(hakuNameContains(hakuNameFilter))
    .filter(statusContains(statusFilter))
    .filter(phaseContains(phaseFilter))
    .sort(avustushakuSorter(value.sortingState));
  return (
    <div className={styles.containerForModals}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <colgroup>
            <col style={{ maxWidth: "400px" }} />
          </colgroup>
          <thead>
            <SortStateContext.Provider value={value}>
              <tr>
                <TableHeader sortKey="avustushaku" text="avustushaku">
                  <input
                    className={styles.nameFilter}
                    placeholder="Avustushaku"
                    onChange={(e) => setHakuNameFilter(e.target.value)}
                    value={hakuNameFilter}
                  />
                </TableHeader>
                <TableHeader sortKey="status" text="avustushaun tila">
                  <StatusTableLabel
                    text="Tila"
                    statuses={AVUSTUSHAKU_STATUSES}
                    labelText={(status) => StatusToFi[status]}
                    isChecked={(status) => statusFilter.includes(status)}
                    onToggle={(status, isChecked) =>
                      setStatusFilter((filters) => {
                        if (isChecked) {
                          return filters.filter((s) => s !== status);
                        }
                        return filters.concat(status);
                      })
                    }
                    amountOfStatus={(status) =>
                      hakuList.filter((a) => a.status === status).length
                    }
                    showDeleteButton={
                      statusFilter.length !== AVUSTUSHAKU_STATUSES.length
                        ? {
                            ariaLabel:
                              "Poista avustustushakujen tila rajaukset",
                            onClick: () =>
                              setStatusFilter([...AVUSTUSHAKU_STATUSES]),
                          }
                        : undefined
                    }
                  />
                </TableHeader>
                <TableHeader sortKey="phase" text="vaihe">
                  <StatusTableLabel
                    text="Vaihe"
                    statuses={AVUSTUSHAKU_PHASES}
                    labelText={(phase) => PhaseToFi[phase]}
                    isChecked={(phase) => phaseFilter.includes(phase)}
                    onToggle={(phase, isChecked) =>
                      setPhaseFilter((filters) => {
                        if (isChecked) {
                          return filters.filter((p) => p !== phase);
                        }
                        return filters.concat(phase);
                      })
                    }
                    amountOfStatus={(phase) =>
                      hakuList.filter((a) => a.phase === phase).length
                    }
                    showDeleteButton={
                      phaseFilter.length !== AVUSTUSHAKU_PHASES.length
                        ? {
                            ariaLabel:
                              "Poista avustustushakujen vaihe rajaukset",
                            onClick: () =>
                              setPhaseFilter([...AVUSTUSHAKU_PHASES]),
                          }
                        : undefined
                    }
                  />
                </TableHeader>
                <TableHeader sortKey="hakuaika" text="hakuaika">
                  <TableLabel text="Hakuaika" disabled />
                </TableHeader>
                <TableHeader sortKey="paatos" text="päätökset">
                  <TableLabel text="Päätös" disabled />
                </TableHeader>
                <TableHeader sortKey="maksatukset" text="maksatukset">
                  <TableLabel text="Maksatus" disabled />
                </TableHeader>
                <TableHeader sortKey="valiselvitykset" text="väliselvitykset">
                  <TableLabel text="Väliselvitys" disabled />
                </TableHeader>
                <TableHeader sortKey="loppuselvitykset" text="loppuselvitykset">
                  <TableLabel text="Loppuselvitys" disabled />
                </TableHeader>
                <TableHeader sortKey="valmistelija" text="valmistelijat">
                  <TableLabel text="V.Valmistelija" disabled />
                </TableHeader>
                <TableHeader
                  sortKey="muutoshakukelpoinen"
                  text="muutoshakukelpoisuus"
                >
                  <TableLabel text="Muutoshakukelpoinen" disabled />
                </TableHeader>
                <TableHeader sortKey="budjetti" text="budjetit">
                  <TableLabel text="Budjetti" disabled />
                </TableHeader>
                <TableHeader sortKey="kayttoaikaAlkaa" text="käyttöaika alkaa">
                  <TableLabel text="Käyttöaika alkaa" disabled />
                </TableHeader>
                <TableHeader
                  sortKey="kayttoaikaPaattyy"
                  text="käyttöaika päättyy"
                >
                  <TableLabel text="Käyttöaika päättyy" disabled />
                </TableHeader>
                <TableHeader sortKey="jaossaOllutSumma" text="jaetut summat">
                  <TableLabel text="Jaossa ollut summa €" disabled />
                </TableHeader>
                <TableHeader sortKey="maksettuSumma" text="maksetut summat">
                  <TableLabel text="Maksettu summa €" disabled />
                </TableHeader>
              </tr>
            </SortStateContext.Provider>
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
                    <GoodBadDate
                      goodDate={avustushaku["paatokset-lahetetty"]}
                    />
                  </td>
                  <td>
                    <GoodBadDate
                      goodDate={avustushaku["maksatukset-lahetetty"]}
                    />
                  </td>
                  <td>
                    <GoodBadDate
                      goodDate={avustushaku["valiselvitykset-lahetetty"]}
                      badDate={avustushaku.valiselvitysdate}
                    />
                  </td>
                  <td>
                    <GoodBadDate
                      goodDate={avustushaku["loppuselvitykset-lahetetty"]}
                      badDate={avustushaku.loppuselvitysdate}
                    />
                  </td>
                  <td>
                    <button
                      className={buttonStyles.greyButton}
                      title={
                        avustushaku.vastuuvalmistelija ??
                        "Ei vastuuvalmistelijaa"
                      }
                    >
                      {avustushaku.vastuuvalmistelija
                        ?.split(/\s+/)
                        .reduce(
                          (initials, name) => initials + name.slice(0, 1),
                          ""
                        ) ?? "-"}
                    </button>
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
                    {avustushaku.content["total-grant-size"] ?? "-"}
                  </td>
                  <td className={styles.alignRight}>
                    {avustushaku["maksatukset-summa"] ?? "-"}
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
              <td colSpan={7}>
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

const hakuNameContains =
  (s: string) => (haku: Avustushaku, _i: number, _a: Avustushaku[]) =>
    haku.content.name.fi.includes(s);

const statusContains =
  (selectedFilters: AvustushakuStatus[]) =>
  ({ status }: Avustushaku) =>
    selectedFilters.includes(status);

const phaseContains =
  (selectedPhases: AvustushakuPhase[]) =>
  ({ phase }: Avustushaku) =>
    selectedPhases.includes(phase);
