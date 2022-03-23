import React, {useEffect, useReducer, useRef, useState} from "react";
import {
  ALL_STATUSES,
  Avustushaku,
  Hakemus,
  HakemusArviointiStatus,
  SelvitysStatus
} from "soresu-form/web/va/types";

import styles from './NewHakemusListing.module.less'
import {MuutoshakemusStatus} from "soresu-form/web/va/types/muutoshakemus";
import {
  HakemusSelvitys,
  Loppuselvitys,
  Muutoshakemus
} from "soresu-form/web/va/status";
import HakemusArviointiStatuses
  from "../hakemus-details/HakemusArviointiStatuses";
import {Pill} from "./Pill";
import {Role} from "../types";

import polygonSrc from '../img/polygon.svg'

interface Props {
  selectedHakemus: Hakemus | undefined | {}
  hakemusList: Hakemus[]
  avustushaku: Avustushaku
  roles: Role[]
  splitView: boolean
  onSelectHakemus: (hakemusId: number) => void
  onYhteenvetoClick: (filteredHakemusList: Hakemus[]) => void
}

type MuutoshakemusStatuses = typeof Muutoshakemus.statuses[number]
type ValiselvitysStatuses = typeof HakemusSelvitys.statuses[number]
type LoppuselvitysStatuses = typeof Loppuselvitys.statuses[number]

interface State {
  filterHakemusStatus: readonly HakemusArviointiStatus[]
  filterMuutoshakemusStatus: readonly MuutoshakemusStatuses[]
  filterValiselvitysStatus: readonly ValiselvitysStatuses[]
  filterLoppuselvitysStatus: readonly LoppuselvitysStatuses[]
  filterOrganization: string
  filterProjectName: string
  filteredList: Hakemus[]
  list: Hakemus[]
}

type Action =
  | {type: 'set-organization-name-filter', value: string}
  | {type: 'set-project-name-filter', value: string}
  | {type: 'set-hakemus-status-filter', value: HakemusArviointiStatus}
  | {type: 'unset-hakemus-status-filter', value: HakemusArviointiStatus}
  | {type: 'set-muutoshakemus-status-filter', value: MuutoshakemusStatuses}
  | {type: 'unset-muutoshakemus-status-filter', value: MuutoshakemusStatuses}
  | {type: 'set-valiselvitys-status-filter', value: ValiselvitysStatuses}
  | {type: 'unset-valiselvitys-status-filter', value: ValiselvitysStatuses}
  | {type: 'set-loppuselvitys-status-filter', value: LoppuselvitysStatuses}
  | {type: 'unset-loppuselvitys-status-filter', value: LoppuselvitysStatuses}
  | {type: 'clear-filter', filter: 'tila' | 'muutoshakemus' | 'valiselvitys' | 'loppuselvitys'}

const filterHakemusList = (state: State): State => {
  const filteredList = state.list.filter(hakemus => {
    const organizationNameOk = hakemus["organization-name"].toLocaleLowerCase().includes(state.filterOrganization)
    const projectNameOk = hakemus["project-name"].toLocaleLowerCase().includes(state.filterProjectName)
    const muutoshakemusStatusOk = state.filterMuutoshakemusStatus.length > 0 && hakemus["status-muutoshakemus"]
      ? state.filterMuutoshakemusStatus.includes(hakemus["status-muutoshakemus"])
      : true
    const valiselvitysStatusOk = state.filterValiselvitysStatus.length > 0 && hakemus["status-valiselvitys"]
      ? hakemus["status-valiselvitys"] === 'information_verified' || state.filterValiselvitysStatus.includes(hakemus["status-valiselvitys"])
      : true
    const loppuselvitysStatusOk = state.filterLoppuselvitysStatus.length > 0 && hakemus["status-loppuselvitys"]
      ? state.filterLoppuselvitysStatus.includes(hakemus["status-loppuselvitys"])
      : true
    return organizationNameOk
      && projectNameOk
      && muutoshakemusStatusOk
      && valiselvitysStatusOk
      && loppuselvitysStatusOk
  })
  return {
    ...state,
    filteredList
  }
}

const defaultFilters = {
  filterHakemusStatus: ALL_STATUSES,
  filterMuutoshakemusStatus: Muutoshakemus.statuses,
  filterValiselvitysStatus: HakemusSelvitys.statuses,
  filterLoppuselvitysStatus: Loppuselvitys.statuses,
} as const

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "set-organization-name-filter":
      return filterHakemusList({ ...state, filterOrganization: action.value })
    case "set-project-name-filter":
      return filterHakemusList({...state, filterProjectName: action.value })
    case "set-hakemus-status-filter":
      return filterHakemusList({ ...state, filterHakemusStatus: state.filterHakemusStatus.concat(action.value)})
    case "unset-hakemus-status-filter":
      return filterHakemusList({...state, filterHakemusStatus: state.filterHakemusStatus.filter(s => s !== action.value)})
    case "set-muutoshakemus-status-filter":
      return filterHakemusList({...state, filterMuutoshakemusStatus: state.filterMuutoshakemusStatus.concat(action.value)})
    case "unset-muutoshakemus-status-filter":
      return filterHakemusList({ ...state, filterMuutoshakemusStatus: state.filterMuutoshakemusStatus.filter(s => s !== action.value)})
    case "set-valiselvitys-status-filter":
      return filterHakemusList({ ...state, filterValiselvitysStatus: state.filterValiselvitysStatus.concat(action.value)})
    case "unset-valiselvitys-status-filter":
      return filterHakemusList({ ...state, filterValiselvitysStatus: state.filterValiselvitysStatus.filter(s => s !== action.value)})
    case "set-loppuselvitys-status-filter":
      return filterHakemusList({ ...state, filterLoppuselvitysStatus: state.filterLoppuselvitysStatus.concat(action.value)})
    case "unset-loppuselvitys-status-filter":
      return filterHakemusList({ ...state, filterLoppuselvitysStatus: state.filterLoppuselvitysStatus.filter(s => s !== action.value)})
    case "clear-filter": {
      switch (action.filter) {
        case "tila":
          return filterHakemusList({ ...state, filterHakemusStatus: defaultFilters.filterHakemusStatus })
        case "muutoshakemus":
          return filterHakemusList({ ...state, filterMuutoshakemusStatus: defaultFilters.filterMuutoshakemusStatus })
        case "valiselvitys":
          return filterHakemusList({ ...state, filterValiselvitysStatus: defaultFilters.filterValiselvitysStatus })
        case "loppuselvitys":
          return filterHakemusList({ ...state, filterLoppuselvitysStatus: defaultFilters.filterLoppuselvitysStatus })
        default:
          throw Error(`unknown filter ${action.filter}`)
      }
    }
    default:
      throw Error('unknown action')
  }
}

const getDefaultState = (list: Hakemus[]): State => ({
  ...defaultFilters,
  filterOrganization: '',
  filterProjectName: '',
  list,
  filteredList: list,
})

export default function NewHakemusListing(props: Props) {
  const {avustushaku, selectedHakemus, hakemusList, onSelectHakemus, onYhteenvetoClick, roles, splitView} = props
  const selectedHakemusId = selectedHakemus && 'id' in selectedHakemus ? selectedHakemus.id : undefined
  const [state, dispatch] = useReducer(reducer, getDefaultState(hakemusList))
  const isResolved = avustushaku.status === 'resolved'
  return (
    <div className={selectedHakemus && splitView ? styles.splitView : undefined}>
      {
        isResolved ? (
          <ResolvedTable
            selectedHakemusId={selectedHakemusId}
            onYhteenvetoClick={onYhteenvetoClick}
            onSelectHakemus={onSelectHakemus}
            state={state}
            dispatch={dispatch}
            roles={roles}
          />
        ) : (
          <div>Todo</div>
        )
      }
    </div>
  )
}

interface ResolvedTableProps {
  selectedHakemusId: number | undefined
  state: State
  dispatch: React.Dispatch<Action>
  onSelectHakemus: (hakemusId: number) => void
  onYhteenvetoClick: (filteredHakemusList: Hakemus[]) => void
  roles: Role[]
}

function ResolvedTable(props: ResolvedTableProps) {
  const {
    selectedHakemusId,
    state,
    dispatch,
    onSelectHakemus,
    onYhteenvetoClick,
    roles,
  } = props

  const onOrganizationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({type: 'set-organization-name-filter', value: event.target.value})
  }
  const onProjectInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({type: 'set-project-name-filter', value: event.target.value})
  }
  const {filterProjectName, filterOrganization, filterHakemusStatus, filterMuutoshakemusStatus, filterValiselvitysStatus, filteredList, list} = state
  const totalBudgetGranted = filteredList
    .map(h => h.arvio["budget-granted"])
    .reduce<number>((totalGranted, granted) => {
      if (!granted) {
        return totalGranted
      }
      return totalGranted + granted
    }, 0)
  return (
    <table className={styles.hakemusTable}>
      <colgroup>
        <col style={{width: '186px'}} />
        <col style={{width: '210px'}} />
        <col style={{width: '106px'}} />
        <col style={{width: '136px'}} />
        <col style={{width: '136px'}} />
        <col style={{width: '136px'}} />
        <col style={{width: '80px'}} />
        <col style={{width: '84px'}} />
        <col style={{width: '59px'}} />
      </colgroup>
      <thead>
        <tr>
          <th className={styles.fixedColumn}>
            <div className={styles.filterInput}>
              <input placeholder="Hakijaorganisaatio" onChange={onOrganizationInput} value={filterOrganization} />
              <PolygonIcon />
            </div>
          </th>
          <th className={styles.fixedColumn}>
            <div className={styles.filterInput}>
              <input placeholder="Hanke tai asianumero" onChange={onProjectInput} value={filterProjectName} />
              <PolygonIcon />
            </div>
          </th>
          <th>
            <StatusTableLabel
              text="Tila"
              statuses={ALL_STATUSES}
              labelText={HakemusArviointiStatuses.statusToFI}
              isChecked={status => filterHakemusStatus.includes(status)}
              onCheck={status => dispatch({type: 'set-hakemus-status-filter', value: status})}
              onUncheck={status => dispatch({type: 'unset-hakemus-status-filter', value: status})}
              amountOfStatus={status => list.filter(h => h.arvio.status === status).length}
              showDeleteButton={
                state.filterHakemusStatus.length !== ALL_STATUSES.length
                  ? { ariaLabel: "Poista hakemuksen tila rajaukset", onClick: () => dispatch({type: 'clear-filter', filter: 'tila'})}
                  : undefined}
            />
          </th>
          <th>
            <StatusTableLabel
              text="Muutoshakemus"
              statuses={Muutoshakemus.statuses}
              labelText={Muutoshakemus.statusToFI}
              isChecked={status => filterMuutoshakemusStatus.includes(status)}
              onCheck={status => dispatch({type: 'set-muutoshakemus-status-filter', value: status})}
              onUncheck={status => dispatch({type: 'unset-muutoshakemus-status-filter', value: status})}
              amountOfStatus={status => list.filter(h => h["status-muutoshakemus"] === status).length}
              showDeleteButton={
                state.filterMuutoshakemusStatus.length !== Muutoshakemus.statuses.length
                  ? { ariaLabel: "Poista muutoshakemus rajaukset", onClick: () => dispatch({type: 'clear-filter', filter: 'muutoshakemus'})}
                  : undefined}
            />
          </th>
          <th>
            <StatusTableLabel
              text="Väliselvitys"
              statuses={HakemusSelvitys.statuses}
              labelText={HakemusSelvitys.statusToFI}
              isChecked={status => filterValiselvitysStatus.includes(status)}
              onCheck={status => dispatch({type: 'set-valiselvitys-status-filter', value: status})}
              onUncheck={status => dispatch({type: 'unset-valiselvitys-status-filter', value: status})}
              amountOfStatus={status => list.filter(h => h["status-valiselvitys"] === status).length}
              showDeleteButton={
                state.filterValiselvitysStatus.length !== HakemusSelvitys.statuses.length
                  ? { ariaLabel: "Poista väliselvitys rajaukset", onClick: () => dispatch({type: 'clear-filter', filter: 'valiselvitys'})}
                  : undefined}
            />
          </th>
          <th>
            <StatusTableLabel
              text="Loppuselvitys"
              statuses={Loppuselvitys.statuses}
              labelText={Loppuselvitys.statusToFI}
              isChecked={status => state.filterLoppuselvitysStatus.includes(status)}
              onCheck={status => dispatch({type: 'set-loppuselvitys-status-filter', value: status})}
              onUncheck={status => dispatch({type: 'unset-loppuselvitys-status-filter', value: status})}
              amountOfStatus={status => list.filter(h => h["status-loppuselvitys"] === status).length}
              showDeleteButton={
                state.filterLoppuselvitysStatus.length !== Loppuselvitys.statuses.length
                  ? { ariaLabel: "Poista loppuselvitys rajaukset", onClick: () => dispatch({type: 'clear-filter', filter: 'loppuselvitys'})}
                  : undefined}
              />
          </th>
          <th><TableLabel text="Myönnetty" disabled /></th>
          <th><TableLabel text="Valmistelija" disabled /></th>
          <th><TableLabel text="Arvioija" disabled /> </th>
        </tr>
      </thead>
      <tbody>
      {filteredList.map(hakemus => (
        <tr key={`hakemus-${hakemus.id}`}
            className={hakemus.id === selectedHakemusId ? styles.selectedHakemusRow : styles.hakemusRow}
            tabIndex={0}
            onClick={() => onSelectHakemus(hakemus.id)}
            onKeyDown={e => e.key === 'Enter' && onSelectHakemus(hakemus.id)}>
          <td className={styles.fixedColumn}>{hakemus["organization-name"]}</td>
          <td className={styles.fixedColumn}>{hakemus["project-name"]}</td>
          <td><ArvioStatus status={hakemus.arvio.status} /></td>
          <td><MuutoshakemusPill status={hakemus["status-muutoshakemus"]} /></td>
          <td><ValiselvitysPill status={hakemus["status-valiselvitys"]} /></td>
          <td><LoppuselvitysPill status={hakemus["status-loppuselvitys"]} /></td>
          <td className={styles.alignCenter}>{
            hakemus.arvio["budget-granted"]
              ? euroFormatter.format(hakemus.arvio["budget-granted"])
              : '-'
          }</td>
          <td>{roles.filter(r => r.role === 'presenting_officer').map(r => r.name).join(', ')}</td>
          <td>{roles.filter(r => r.role === 'evaluator').map(r => r.name).join(', ')}</td>
        </tr>
      ))}
      </tbody>
      <tfoot>
      <tr>
        <td colSpan={6}>
          {filteredList.length}/{list.length} hakemusta
          <a className={styles.yhteenveto} href="/yhteenveto/" target="_blank" onClick={() => onYhteenvetoClick(filteredList)}>Näytä yhteenveto</a>
        </td>
        <td colSpan={1} className={styles.alignCenter}>
          {totalBudgetGranted > 0 ? euroFormatter.format(totalBudgetGranted) : '-'}
        </td>
        <td colSpan={2} />
      </tr>
      </tfoot>
    </table>
  )
}

const PolygonIcon = () => <img src={polygonSrc} alt="ikoni" className={styles.polygon}/>

interface TableLabelProps {
  text: string
  disabled?: boolean
  showDeleteButton?: {
    ariaLabel: string
    onClick: () => void
  }
}

const TableLabel: React.FC<TableLabelProps> = ({text, disabled, showDeleteButton, children} ) => {
  const [toggled, toggleMenu] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef?.current && event.target instanceof Element && !popupRef.current.contains(event.target)) {
        toggleMenu(value => !value)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupRef])
  return (
    <div className={styles.tableLabel}>
      <button disabled={!!disabled} onClick={() => toggleMenu(state => !state)} className={styles.tableLabelBtn}>
        <span>{text}</span>
      </button>
      {showDeleteButton && (
        <button className={styles.deleteBtn} onClick={showDeleteButton.onClick} aria-labelledby={showDeleteButton.ariaLabel} />
      )}
      <PolygonIcon />
      {toggled && (
        <div className={styles.tableLabelPopup} ref={popupRef} >
          {children}
        </div>
      )}
    </div>
  )
}

type Statuses = HakemusArviointiStatus | MuutoshakemusStatuses| ValiselvitysStatuses | LoppuselvitysStatuses

interface StatusTableLabelProps<Status extends Statuses> extends TableLabelProps {
  statuses: readonly Status[]
  labelText: (status: Status) => string
  isChecked: (status: Status) => boolean
  onCheck: (status: Status) => void
  onUncheck: (status: Status) => void
  amountOfStatus: (status: Status) => number
}

function StatusTableLabel<Status extends Statuses>({statuses, labelText, text, isChecked, onCheck, onUncheck, amountOfStatus, showDeleteButton}: StatusTableLabelProps<Status>) {
  return <TableLabel text={text} showDeleteButton={showDeleteButton}>
    {statuses.map(status => {
      const checked = isChecked(status)
      return (
        <div key={`muutoshakemus-status-${status}`} className={styles.statusCheckbox}>
          <input type="checkbox" id={status} checked={checked} onChange={() => {
            if (checked) {
              onUncheck(status)
            } else {
              onCheck(status)
            }
          }} />
          <label htmlFor={status}>{labelText(status)} ({amountOfStatus(status)})</label>
        </div>
      )
    })}
  </TableLabel>
}

const euroFormatter = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 })

const EmptyGreyPill = () => <Pill color="grey" text="-" />

function ArvioStatus({status}: {status: HakemusArviointiStatus}) {
  const text = HakemusArviointiStatuses.statusToFI(status)
  const color = status === 'accepted'
    ? 'green'
    : status === 'rejected'
    ? 'red'
    : status === 'plausible'
    ?'yellow'
    : 'grey'
  return <Pill color={color} text={text} />
}

function MuutoshakemusPill({status}: {status: MuutoshakemusStatus | undefined}) {
  if (!status) {
    return <EmptyGreyPill />
  }
  const statusToFI = Muutoshakemus.statusToFI(status)
  const color = status === 'rejected' ? 'red' : 'green'
  return <Pill color={color} text={statusToFI} />
}

function ValiselvitysPill({status}: {status: SelvitysStatus | undefined}) {
  // TODO: check should use Loppuselvitys.statusToFi with this field instead
  if (!status || status === 'information_verified') {
    return <EmptyGreyPill />
  }
  const statusToFI = HakemusSelvitys.statusToFI(status)
  // TODO: confirm status colors
  const color = status !== 'accepted'
    ? 'yellow'
    : 'green'
  return <Pill color={color} text={statusToFI} />
}

function LoppuselvitysPill({status}: {status: SelvitysStatus | undefined}) {
  if (!status) {
    return <EmptyGreyPill />
  }
  const statusToFI = Loppuselvitys.statusToFI(status)
  // TODO: confirm status colors
  const color = status !== 'accepted'
    ? 'yellow'
    : 'green'
  return <Pill color={color} text={statusToFI} />
}
