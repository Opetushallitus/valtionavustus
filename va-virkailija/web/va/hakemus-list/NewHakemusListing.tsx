import React, {useReducer, useState} from "react";
import {
  Hakemus,
  HakemusArviointiStatus,
  SelvitysStatus
} from "soresu-form/web/va/types";

import styles from './NewHakemusListing.module.less'
import buttonStyles from './Button.module.less'
import {MuutoshakemusStatus} from "soresu-form/web/va/types/muutoshakemus";
import {
  HakemusSelvitys,
  Loppuselvitys,
  Muutoshakemus
} from "soresu-form/web/va/status";
import HakemusArviointiStatuses
  from "../hakemus-details/HakemusArviointiStatuses";
import {Pill, PillProps} from "./Pill";
import {Role, State} from "../types";

import useOutsideClick from "../useOutsideClick";
import {
  isEvaluator, isPresenter,
  isPresenterRole,
  PersonSelectPanel
} from "./PersonSelectButton";
import HakemustenArviointiController from "../HakemustenArviointiController";
import classNames from "classnames";
import {
  ControlledSelectPanel,
  RoleField
} from "./PersonFilterButton";

interface Props {
  selectedHakemus: Hakemus | undefined | {}
  hakemusList: Hakemus[]
  roles: Role[]
  splitView: boolean
  onSelectHakemus: (hakemusId: number) => void
  onYhteenvetoClick: (filteredHakemusList: Hakemus[]) => void
  isResolved: boolean
  controller: HakemustenArviointiController
  state: State
  toggleSplitView: () => void
}

type MuutoshakemusStatuses = typeof Muutoshakemus.statuses[number]
type ValiselvitysStatuses = typeof HakemusSelvitys.statuses[number]
type LoppuselvitysStatuses = typeof Loppuselvitys.statuses[number]

interface FilterState {
  status: {
    hakemus: readonly HakemusArviointiStatus[],
    muutoshakemus: readonly MuutoshakemusStatuses[]
    valiselvitys: readonly ValiselvitysStatuses[]
    loppuselvitys: readonly LoppuselvitysStatuses[]
  },
  organization: string
  projectNameOrCode: string
  presenter?: number
  evaluator?: number
}

type FilterKeys = keyof FilterState["status"]
type FilterValue<FilterKey extends FilterKeys> = FilterState["status"][FilterKey][number]

const SORTING_KEYS = [ 'organization', 'registerNumber', 'hakemus', 'muutoshakemus', 'valiselvitys', 'loppuselvitys', 'applied', 'granted', 'score' ] as const
type SortOrder = 'asc' | 'desc'
type SortKey = typeof SORTING_KEYS[number]
type SorterMap = {
  [k in SortKey]: (h: Hakemus) => number | string
}
type SortState = { sortKey: SortKey | undefined, sortOrder: SortOrder }

const sortValueMap: SorterMap = {
  organization: (h: Hakemus) => h["organization-name"],
  registerNumber: (h: Hakemus) => h["register-number"] ?? 'zzz',
  hakemus: (h: Hakemus) => h.arvio.status,
  muutoshakemus: (h: Hakemus) => h.muutoshakemukset?.[0]?.status ?? h["status-muutoshakemus"] ?? 'zzz',
  valiselvitys: (h: Hakemus) => h["status-valiselvitys"],
  loppuselvitys: (h: Hakemus) => h["status-loppuselvitys"],
  applied: (h: Hakemus) => h["budget-oph-share"],
  granted: (h: Hakemus) => h.arvio["budget-granted"] ?? 0,
  score: (h: Hakemus) => h.arvio.scoring?.["score-total-average"] ?? 0,
}

const hakemusSorter = ({ sortKey, sortOrder, }: SortState) => (a: Hakemus, b: Hakemus): number => {
  const sortOrderCoef = sortOrder === 'asc' ? -1 : 1
  const sortResult = sortKey && sortValueMap[sortKey](a) > sortValueMap[sortKey](b) ? 1 : -1
  return sortOrderCoef * sortResult
}

type StatusFilterAction<Filter extends FilterKeys> =
  | {type: `set-status-filter`, filter: Filter, value: FilterValue<Filter>}
  | {type: `unset-status-filter`, filter: Filter, value: FilterValue<Filter>}
  | {type: `clear-status-filter`, filter: Filter}

type Action =
  | {type: 'set-organization-name-filter', value: string}
  | {type: 'set-project-name-filter', value: string}
  | {type: 'set-evaluator-filter', id?: number}
  | {type: 'set-presenter-filter', id?: number}
  | {type: 'set-sorting', key: SortKey }
  | StatusFilterAction<'hakemus'>
  | StatusFilterAction<'valiselvitys'>
  | StatusFilterAction<'loppuselvitys'>
  | StatusFilterAction<'muutoshakemus'>

const hakemusFilter = (state: FilterState) => (hakemus: Hakemus) => {
  const organizationNameOk = hakemus["organization-name"].toLocaleLowerCase().includes(state.organization)
  const projectNameOrRegisternumberOk = (hakemus["project-name"] + hakemus["register-number"] || '').toLocaleLowerCase().includes(state.projectNameOrCode)
  const hakemusStatusOK = state.status.hakemus.length > 0 && state.status.hakemus.includes(hakemus.arvio.status)
  const muutoshakemusStatusOk = state.status.muutoshakemus.length > 0 && hakemus["status-muutoshakemus"]
    ? state.status.muutoshakemus.includes(hakemus["status-muutoshakemus"])
    : true
  const valiselvitysStatusOk = state.status.valiselvitys.length > 0 && hakemus["status-valiselvitys"]
    ? hakemus["status-valiselvitys"] === 'information_verified' || state.status.valiselvitys.includes(hakemus["status-valiselvitys"])
    : true
  const loppuselvitysStatusOk = state.status.loppuselvitys.length > 0 && hakemus["status-loppuselvitys"]
    ? state.status.loppuselvitys.includes(hakemus["status-loppuselvitys"])
    : true
  const evaluatorOk = state.evaluator !== undefined
    ? isEvaluator(hakemus, {id: state.evaluator})
    : true
  const presenterOk = state.presenter !== undefined
    ? isPresenter(hakemus, {id: state.presenter})
    : true
  return organizationNameOk
    && projectNameOrRegisternumberOk
    && hakemusStatusOK
    && muutoshakemusStatusOk
    && valiselvitysStatusOk
    && loppuselvitysStatusOk
    && evaluatorOk
    && presenterOk
}

const defaultStatusFilters = {
  hakemus: HakemusArviointiStatuses.statuses.filter(s => s !== 'rejected'),
  muutoshakemus: Muutoshakemus.statuses,
  valiselvitys: HakemusSelvitys.statuses,
  loppuselvitys: Loppuselvitys.statuses,
} as const

const reducer = (state: FilterState, action: Action): FilterState => {
  switch (action.type) {
    case "set-organization-name-filter":
      return {...state, organization: action.value}
    case "set-project-name-filter":
      return {...state, projectNameOrCode: action.value}
    case "set-status-filter": {
      return {
        ...state,
        status: {
          ...state.status,
          [action.filter]: [...state.status[action.filter], action.value]
        }
      }
    }
    case "unset-status-filter": {
      const cloned = [...state.status[action.filter]]
      return {
        ...state,
        status: {
          ...state.status,
          [action.filter]: cloned.filter(s => s !== action.value)
        }
      }
    }
    case "clear-status-filter": {
      const clearedStatuses = action.filter === 'hakemus'
        ? HakemusArviointiStatuses.statuses
        : defaultStatusFilters[action.filter]
      return {
        ...state,
        status: {
          ...state.status,
          [action.filter]: [...clearedStatuses]
        }
      }
    }
    case "set-evaluator-filter": {
      return {...state, evaluator: action.id }
    }
    case "set-presenter-filter": {
      return { ...state, presenter: action.id }
    }
    default:
      throw Error('unknown action')
  }
}

const getDefaultState = (): FilterState => ({
  status: {
    ...defaultStatusFilters
  },
  projectNameOrCode: '',
  organization: '',
  presenter: undefined,
  evaluator: undefined,
})

const useSorting = (): [SortState, (newSortKey?: SortKey) => void] => {
  const [sortKey, setSortKey] = useState<SortKey | undefined>()
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const setSorting = (newSortKey?: SortKey) => {
    if (sortKey === newSortKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(newSortKey)
      setSortOrder('asc')
    }
  }

  return [{ sortKey, sortOrder }, setSorting]
}

export default function NewHakemusListing(props: Props) {
  const {selectedHakemus, hakemusList, onSelectHakemus, onYhteenvetoClick, roles, splitView, isResolved, controller, state, toggleSplitView} = props
  const selectedHakemusId = selectedHakemus && 'id' in selectedHakemus ? selectedHakemus.id : undefined
  const [filterState, dispatch] = useReducer(reducer, getDefaultState())
  const [sortingState, setSorting] = useSorting()
  const filteredList = hakemusList
    .filter(hakemusFilter(filterState))
    .sort(hakemusSorter(sortingState))
  const totalBudgetGranted = filteredList
    .reduce<number>((totalGranted, hakemus) => {
      const granted = hakemus.arvio["budget-granted"]
      if (!granted) {
        return totalGranted
      }
      return totalGranted + granted
    }, 0)
  return (
    <div id="hakemus-listing" className={selectedHakemus && splitView ? styles.splitView : undefined}>
      {
        isResolved ? (
          <ResolvedTable
            selectedHakemusId={selectedHakemusId}
            onYhteenvetoClick={onYhteenvetoClick}
            onSelectHakemus={onSelectHakemus}
            filterState={filterState}
            filteredList={filteredList}
            list={hakemusList}
            dispatch={dispatch}
            roles={roles}
            totalBudgetGranted={totalBudgetGranted}
            controller={controller}
            state={state}
            toggleSplitView={toggleSplitView}
            sortingState={sortingState}
            setSorting={setSorting}
          />
        ) : (
          <HakemusTable
            selectedHakemusId={selectedHakemusId}
            onYhteenvetoClick={onYhteenvetoClick}
            onSelectHakemus={onSelectHakemus}
            filterState={filterState}
            filteredList={filteredList}
            list={hakemusList}
            dispatch={dispatch}
            roles={roles}
            totalBudgetGranted={totalBudgetGranted}
            controller={controller}
            state={state}
            toggleSplitView={toggleSplitView}
            sortingState={sortingState}
            setSorting={setSorting}
        />
        )
      }
    </div>
  )
}

interface HakemusTableProps {
  selectedHakemusId: number | undefined
  filterState: FilterState
  list: Hakemus[]
  filteredList: Hakemus[]
  dispatch: React.Dispatch<Action>
  onSelectHakemus: (hakemusId: number) => void
  onYhteenvetoClick: (filteredHakemusList: Hakemus[]) => void
  roles: Role[]
  totalBudgetGranted: number
  controller: HakemustenArviointiController
  state: State
  toggleSplitView: (forceValue?: boolean) => void
  setSorting: (sortKey?: SortKey) => void
  sortingState: SortState
}

function hakemusModifiedAfterSubmitted(hakemus :Hakemus) {
  return hakemus["submitted-version"] && hakemus["submitted-version"] !== hakemus.version
}

function HakemusTable({dispatch, filterState, list, filteredList, selectedHakemusId, onSelectHakemus, onYhteenvetoClick, roles, totalBudgetGranted, state, controller, toggleSplitView, sortingState, setSorting}: HakemusTableProps) {
  const onOrganizationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({type: 'set-organization-name-filter', value: event.target.value})
  }
  const onProjectInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({type: 'set-project-name-filter', value: event.target.value})
  }
  const totalOphShare = filteredList.reduce((total, hakemus) => {
    const ophShare = hakemus["budget-oph-share"]
    return total + ophShare
  }, 0)
  const {organization, projectNameOrCode, status: statusFilter} = filterState
  return (
    <table className={styles.hakemusTable}>
      <colgroup>
        <col style={{width: '216px'}} />
        <col style={{width: '210px'}} />
        <col style={{width: '100px'}} />
        <col style={{width: '136px'}} />
        <col style={{width: '136px'}} />
        <col style={{width: '80px'}} />
        <col style={{width: '80px'}} />
        <col style={{width: '80px'}} />
        <col style={{width: '95px'}} />
      </colgroup>
      <thead>
      <tr>
        <th>
          <div className={styles.tableHeader}>
            <input placeholder="Hakijaorganisaatio" onChange={onOrganizationInput} value={organization} />
            <SortButton sortKey="organization" sortingState={sortingState} setSorting={setSorting} text="hakijaorganisaatio" />
          </div>
        </th>
        <th>
          <div className={styles.tableHeader}>
            <input placeholder="Asianumero tai hanke" onChange={onProjectInput} value={projectNameOrCode} />
            <SortButton sortKey="registerNumber" sortingState={sortingState} setSorting={setSorting} text="asianumero" />
          </div>
        </th>
        <th>
          <div className={styles.tableHeader}>
            <TableLabel text="Arvio" disabled />
            <SortButton sortKey="score" sortingState={sortingState} setSorting={setSorting} text="arvio" />
          </div>
        </th>
        <th>
          <div className={styles.tableHeader}>
            <StatusTableLabel
              text="Tila"
              statuses={HakemusArviointiStatuses.statuses}
              labelText={HakemusArviointiStatuses.statusToFI}
              isChecked={status => statusFilter.hakemus.includes(status)}
              onCheck={status => dispatch({type: 'set-status-filter', filter: 'hakemus', value: status})}
              onUncheck={status => dispatch({type: 'unset-status-filter', filter: 'hakemus', value: status})}
              amountOfStatus={status => list.filter(h => h.arvio.status === status).length}
              showDeleteButton={
                statusFilter.hakemus.length !== HakemusArviointiStatuses.statuses.length
                  ? { ariaLabel: "Poista hakemuksen tila rajaukset", onClick: () => dispatch({type: 'clear-status-filter', filter: 'hakemus'})}
                  : undefined}
            />
            <SortButton sortKey="hakemus" setSorting={setSorting} sortingState={sortingState} text="hakemuksen tila" />
          </div>
        </th>
        <th>
          <div className={styles.tableHeader}>
            <StatusTableLabel
              text="Muutoshakemus"
              statuses={Muutoshakemus.statuses}
              labelText={Muutoshakemus.statusToFI}
              isChecked={status => statusFilter.muutoshakemus.includes(status)}
              onCheck={status => dispatch({type: 'set-status-filter', filter: 'muutoshakemus', value: status})}
              onUncheck={status => dispatch({type: 'unset-status-filter', filter: 'muutoshakemus', value: status})}
              amountOfStatus={status => list.filter(h => h["status-muutoshakemus"] === status).length}
              showDeleteButton={
                statusFilter.muutoshakemus.length !== Muutoshakemus.statuses.length
                  ? { ariaLabel: "Poista muutoshakemus rajaukset", onClick: () => dispatch({type: 'clear-status-filter', filter: 'muutoshakemus'})}
                  : undefined}
            />
            <SortButton sortKey="muutoshakemus" setSorting={setSorting} sortingState={sortingState} text="muutoshakemuksen tila" />
          </div>
        </th>
        <th>
          <div className={styles.tableHeader}>
            <TableLabel text="Haettu" disabled />
            <SortButton sortKey="applied" sortingState={sortingState} setSorting={setSorting} text="haettu summa" />
          </div>
        </th>
        <th>
          <div className={styles.tableHeader}>
            <TableLabel text="Myönnetty" disabled />
            <SortButton sortKey="granted" sortingState={sortingState} setSorting={setSorting} text="myönnetty summa" />
          </div>
        </th>
        <th>
          <PersonTableLabel
            text="Valmistelija"
            roleField="presenter"
            roles={roles}
            onClickRole={id => dispatch({type: 'set-presenter-filter', id})}
            activeId={filterState.presenter}
            showDeleteButton={filterState.presenter !== undefined
              ? {
                onClick: () => dispatch({type: 'set-presenter-filter', id: undefined}),
                ariaLabel: 'Poista valmistelija rajaus'
              } : undefined}
          />
        </th>
        <th>
          <PersonTableLabel
            text="Arvioija"
            roleField="evaluator"
            roles={roles}
            onClickRole={id => dispatch({type: 'set-evaluator-filter', id})}
            activeId={filterState.evaluator}
            showDeleteButton={filterState.evaluator !== undefined
              ? {
                onClick: () => dispatch({type: 'set-evaluator-filter', id: undefined}),
                ariaLabel: 'Poista arvioija rajaus'
              } : undefined}
          />
        </th>
      </tr>
      </thead>
      <tbody>
      {filteredList.map(hakemus => {
        const modified = hakemusModifiedAfterSubmitted(hakemus)
        const draft = hakemus.status === 'draft'

        return (
          <tr key={`hakemus-${hakemus.id}`}
              className={hakemus.id === selectedHakemusId ? styles.selectedHakemusRow : styles.hakemusRow}
              tabIndex={0}
              onClick={() => onSelectHakemus(hakemus.id)}
              onKeyDown={e => e.key === 'Enter' && onSelectHakemus(hakemus.id)}
              data-test-id={`hakemus-${hakemus["user-key"]}`}>
            <td className="organization-cell">{hakemus["organization-name"]}</td>
            <td className="project-name-cell">
              <div className={styles.projectTd}>
                {getProject(hakemus)}
                {modified && <Pill color="blue" testId={`${hakemus.id}-modified-pill`} text="Muokattu" compact />}
                {draft && <Pill color="yellow" text="Keskeneräinen" compact />}
              </div>
            </td>
            <td>Tähtii</td>
            <td className="hakemus-status-cell"><ArvioStatus status={hakemus.arvio.status} /></td>
            <td><MuutoshakemusPill status={hakemus["status-muutoshakemus"]} /></td>
            <td className={`${styles.alignRight} applied-sum-cell`}>{euroFormatter.format(hakemus["budget-oph-share"])}</td>
            <td className={`${styles.alignRight} granted-sum-cell`}>{
              hakemus.arvio["budget-granted"]
                ? euroFormatter.format(hakemus.arvio["budget-granted"])
                : '-'
            }</td>
            <td className={styles.alignCenter}>
              <PeopleRoleButton roles={roles} controller={controller} hakemus={hakemus} state={state} toggleSplitView={toggleSplitView} onSelectHakemus={onSelectHakemus} selectedRole="presenter"/>
            </td>
            <td className={styles.alignCenter}>
              <PeopleRoleButton roles={roles} controller={controller} hakemus={hakemus} state={state} toggleSplitView={toggleSplitView} onSelectHakemus={onSelectHakemus} selectedRole="evaluators"/>
              {state.personSelectHakemusId === hakemus.id && <PersonSelectPanel hakemus={hakemus} state={state} controller={controller}  />}
            </td>
          </tr>
        )
      })}
      </tbody>
      <tfoot>
      <tr>
        <td colSpan={5}>
          {filteredList.length}/{list.length} hakemusta
          <a className={styles.yhteenveto} href="/yhteenveto/" target="_blank" onClick={() => onYhteenvetoClick(filteredList)}>Päätöslista</a>
        </td>
        <td colSpan={1} className={styles.alignRight}>
          {euroFormatter.format(totalOphShare)}
        </td>
        <td colSpan={1} className={styles.alignRight}>
          {totalBudgetGranted > 0 ? euroFormatter.format(totalBudgetGranted) : '-'}
        </td>
        <td colSpan={2} />
      </tr>
      </tfoot>
    </table>
  )
}

interface ResolvedTableProps {
  selectedHakemusId: number | undefined
  filterState: FilterState
  list: Hakemus[]
  filteredList: Hakemus[]
  dispatch: React.Dispatch<Action>
  onSelectHakemus: (hakemusId: number) => void
  onYhteenvetoClick: (filteredHakemusList: Hakemus[]) => void
  roles: Role[]
  totalBudgetGranted: number
  controller: HakemustenArviointiController
  state: State
  toggleSplitView: (forceValue?: boolean) => void
  setSorting: (sortKey?: SortKey) => void
  sortingState: SortState
}

function ResolvedTable(props: ResolvedTableProps) {
  const {
    selectedHakemusId,
    filterState,
    dispatch,
    onSelectHakemus,
    onYhteenvetoClick,
    roles,
    filteredList,
    list,
    totalBudgetGranted,
    controller,
    state,
    toggleSplitView,
    setSorting,
    sortingState,
  } = props

  const onOrganizationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({type: 'set-organization-name-filter', value: event.target.value})
  }
  const onProjectInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({type: 'set-project-name-filter', value: event.target.value})
  }
  const {projectNameOrCode, organization, status: statusFilter} = filterState

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
          <th>
            <div className={styles.tableHeader}>
              <input placeholder="Hakijaorganisaatio" onChange={onOrganizationInput} value={organization} />
              <SortButton sortKey="organization" setSorting={setSorting} sortingState={sortingState} text="hakijaorganisaatio" />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <input placeholder="Asianumero tai hanke" onChange={onProjectInput} value={projectNameOrCode} />
              <SortButton sortKey="registerNumber" setSorting={setSorting} sortingState={sortingState} text="asianumero" />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Tila"
                statuses={HakemusArviointiStatuses.statuses}
                labelText={HakemusArviointiStatuses.statusToFI}
                isChecked={status => statusFilter.hakemus.includes(status)}
                onCheck={status => dispatch({type: 'set-status-filter', filter: 'hakemus', value: status})}
                onUncheck={status => dispatch({type: 'unset-status-filter', filter: 'hakemus', value: status})}
                amountOfStatus={status => list.filter(h => h.arvio.status === status).length}
                showDeleteButton={
                  statusFilter.hakemus.length !== HakemusArviointiStatuses.statuses.length
                    ? { ariaLabel: "Poista hakemuksen tila rajaukset", onClick: () => dispatch({type: 'clear-status-filter', filter: 'hakemus'})}
                    : undefined}
              />
              <SortButton sortKey="hakemus" setSorting={setSorting} sortingState={sortingState} text="hakemuksen tila" />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Muutoshakemus"
                statuses={Muutoshakemus.statuses}
                labelText={Muutoshakemus.statusToFI}
                isChecked={status => statusFilter.muutoshakemus.includes(status)}
                onCheck={status => dispatch({type: 'set-status-filter', filter: 'muutoshakemus', value: status})}
                onUncheck={status => dispatch({type: 'unset-status-filter', filter: 'muutoshakemus', value: status})}
                amountOfStatus={status => list.filter(h => h["status-muutoshakemus"] === status).length}
                showDeleteButton={
                  statusFilter.muutoshakemus.length !== Muutoshakemus.statuses.length
                    ? { ariaLabel: "Poista muutoshakemus rajaukset", onClick: () => dispatch({type: 'clear-status-filter', filter: 'muutoshakemus'})}
                    : undefined}
              />
              <SortButton sortKey="muutoshakemus" setSorting={setSorting} sortingState={sortingState} text="muutoshakemuksen tila" />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Väliselvitys"
                statuses={HakemusSelvitys.statuses}
                labelText={HakemusSelvitys.statusToFI}
                isChecked={status => statusFilter.valiselvitys.includes(status)}
                onCheck={status => dispatch({type: 'set-status-filter', filter: 'valiselvitys', value: status})}
                onUncheck={status => dispatch({type: 'unset-status-filter', filter: 'valiselvitys', value: status})}
                amountOfStatus={status => list.filter(h => h["status-valiselvitys"] === status).length}
                showDeleteButton={
                  statusFilter.valiselvitys.length !== HakemusSelvitys.statuses.length
                    ? { ariaLabel: "Poista väliselvitys rajaukset", onClick: () => dispatch({type: 'clear-status-filter', filter: 'valiselvitys'})}
                    : undefined}
              />
              <SortButton sortKey="valiselvitys" setSorting={setSorting} sortingState={sortingState} text="väliselvityksen tila" />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Loppuselvitys"
                statuses={Loppuselvitys.statuses}
                labelText={Loppuselvitys.statusToFI}
                isChecked={status => statusFilter.loppuselvitys.includes(status)}
                onCheck={status => dispatch({type: 'set-status-filter', filter: 'loppuselvitys', value: status})}
                onUncheck={status => dispatch({type: 'unset-status-filter', filter: 'loppuselvitys', value: status})}
                amountOfStatus={status => list.filter(h => h["status-loppuselvitys"] === status).length}
                showDeleteButton={
                  statusFilter.loppuselvitys.length !== Loppuselvitys.statuses.length
                    ? { ariaLabel: "Poista loppuselvitys rajaukset", onClick: () => dispatch({type: 'clear-status-filter', filter: 'loppuselvitys'})}
                    : undefined}
                />
                <SortButton sortKey="loppuselvitys" setSorting={setSorting} sortingState={sortingState} text="loppuselvityksen tila" />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <TableLabel text="Myönnetty" disabled />
              <SortButton sortKey="granted" setSorting={setSorting} sortingState={sortingState} text="myönnetty summa" />
            </div>
          </th>
          <th>
            <PersonTableLabel
              text="Valmistelija"
              roleField="presenter"
              roles={roles}
              onClickRole={id => dispatch({type: 'set-presenter-filter', id})}
              activeId={filterState.presenter}
              showDeleteButton={filterState.presenter !== undefined
                ? {
                  onClick: () => dispatch({type: 'set-presenter-filter', id: undefined}),
                  ariaLabel: 'Poista valmistelija rajaus'
                } : undefined}
            />
          </th>
          <th>
            <PersonTableLabel
              text="Arvioija"
              roleField="evaluator"
              roles={roles}
              onClickRole={id => dispatch({type: 'set-evaluator-filter', id})}
              activeId={filterState.evaluator}
              showDeleteButton={filterState.evaluator !== undefined
                ? {
                  onClick: () => dispatch({type: 'set-evaluator-filter', id: undefined}),
                  ariaLabel: 'Poista arvioija rajaus'
                } : undefined}
            />
          </th>
        </tr>
      </thead>
      <tbody>
      {filteredList.map(hakemus => (
        <tr key={`hakemus-${hakemus.id}`}
            className={hakemus.id === selectedHakemusId ? styles.selectedHakemusRow : styles.hakemusRow}
            tabIndex={0}
            onClick={() => onSelectHakemus(hakemus.id)}
            onKeyDown={e => e.key === 'Enter' && onSelectHakemus(hakemus.id)}
            data-test-id={`hakemus-${hakemus["user-key"]}`}>
          <td className="organization-cell">{hakemus["organization-name"]}</td>
          <td className="project-name-cell">{getProject(hakemus)}</td>
          <td className="hakemus-status-cell"><ArvioStatus status={hakemus.arvio.status} /></td>
          <td><MuutoshakemusPill status={hakemus["status-muutoshakemus"]} /></td>
          <td><ValiselvitysPill status={hakemus["status-valiselvitys"]} /></td>
          <td><LoppuselvitysPill status={hakemus["status-loppuselvitys"]} /></td>
          <td className={`${styles.alignRight} granted-sum-cell`}>{
            hakemus.arvio["budget-granted"]
              ? euroFormatter.format(hakemus.arvio["budget-granted"])
              : '-'
          }</td>
          <td className={styles.alignCenter}>
            <PeopleRoleButton roles={roles} controller={controller} hakemus={hakemus} state={state} toggleSplitView={toggleSplitView} onSelectHakemus={onSelectHakemus} selectedRole="presenter"/>
          </td>
          <td className={styles.alignCenter}>
            <PeopleRoleButton roles={roles} controller={controller} hakemus={hakemus} state={state} toggleSplitView={toggleSplitView} onSelectHakemus={onSelectHakemus} selectedRole="evaluators"/>
            {state.personSelectHakemusId === hakemus.id && <PersonSelectPanel hakemus={hakemus} state={state} controller={controller}  />}
          </td>
        </tr>
      ))}
      </tbody>
      <tfoot>
      <tr>
        <td colSpan={6}>
          {filteredList.length}/{list.length} hakemusta
          <a className={styles.yhteenveto} href="/yhteenveto/" target="_blank" onClick={() => onYhteenvetoClick(filteredList)}>Päätöslista</a>
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

const getProject = (hakemus: Hakemus) => {
  const registerNumber = hakemus["register-number"] ?? ''
  const projectName = hakemus["project-name"]
  const combined = `${registerNumber} ${projectName}`.trim()
  return (
    <div title={combined} aria-label={combined} className={styles.project}>
      {registerNumber.length > 0 && <span>{registerNumber}</span>}
      <span>{projectName}</span>
    </div>
  )
}

interface PeopleRoleButton {
  roles: Role[],
  controller: HakemustenArviointiController,
  hakemus: Hakemus,
  state: State,
  toggleSplitView: (override?: boolean) => void,
  onSelectHakemus: (hakemusId: number) => void,
  selectedRole: 'evaluators' | 'presenter'
}

const PeopleRoleButton = ({roles, controller, selectedRole, state, toggleSplitView, onSelectHakemus, hakemus}: PeopleRoleButton) => {
  const onClickCallback = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onSelectHakemus(hakemus.id)
    controller.togglePersonSelect(hakemus.id)
    toggleSplitView(true)
  }
  const presentersWanted = selectedRole === 'presenter'
  const buttonInitials = roles
    .filter(role =>
      presentersWanted
        ? isPresenterRole(role) && isPresenter(hakemus, role)
        : isEvaluator(hakemus, role)
    )
    .map(({name}) =>
       name
        .split(/\s+/)
        .reduce((initials, name) => initials + name.slice(0, 1), ''))
    .join(', ')
  const disallowChangeHakemusState = !state.hakuData.privileges["change-hakemus-state"]
  const ariaLabel = presentersWanted ? 'Lisää valmistelija hakemukselle' : 'Lisää arvioija hakemukselle'
  return (
    <React.Fragment>
      {buttonInitials.length === 0
        ? <button aria-label={ariaLabel} disabled={disallowChangeHakemusState} className={buttonStyles.greyButton} onClick={onClickCallback}>+</button>
        : <button aria-label={ariaLabel} disabled={disallowChangeHakemusState} className={buttonStyles.blueButton} onClick={onClickCallback}>{buttonInitials}</button>
      }
    </React.Fragment>
  )
}

type SortButtonProps = {
  sortKey: SortKey
  setSorting: (sortKey: SortKey) => void
  sortingState: SortState
  text: string
}

const SortButton = ({ sortKey, setSorting, sortingState, text }: SortButtonProps) => {
  const isCurrentSortKey = sortKey === sortingState.sortKey
  const isDesc = isCurrentSortKey && sortingState.sortOrder === 'desc'
  const ariaLabel = `Järjestä ${text} ${isDesc ? 'nousevaan' : 'laskevaan'} järjestykseen`
  return (
    <button aria-label={ariaLabel} className={buttonStyles.transparentButton} onClick={() => setSorting(sortKey)} data-test-id={`sort-button-${sortKey}`}>
      <svg width="12px" height="12px" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4.86603 6.5C4.48113 7.16667 3.51887 7.16667 3.13397 6.5L0.535899 2C0.150999 1.33333 0.632123 0.499999 1.40192 0.499999L6.59808 0.5C7.36788 0.5 7.849 1.33333 7.4641 2L4.86603 6.5Z"
          fill={isCurrentSortKey ? '#499CC7' : '#C1C1C1'}
          transform={isDesc ? 'scale(1, -1) translate(0, -8)' : ''}
        />
      </svg>
    </button>
  )
}

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
  const onOutsideClick = () => toggleMenu(value => !value)
  const ref = useOutsideClick<HTMLDivElement>(onOutsideClick)
  return (
    <div className={styles.tableLabel}>
      <button disabled={!!disabled} onClick={() => toggleMenu(state => !state)} className={classNames(styles.tableLabelButton, {[buttonStyles.selected]: toggled})}>{text}</button>
      {showDeleteButton && (
        <button className={buttonStyles.deleteButton} onClick={showDeleteButton.onClick} aria-label={showDeleteButton.ariaLabel} />
      )}
      {toggled && (
        <div className={styles.tableLabelPopup} ref={ref} >
          {children}
        </div>
      )}
    </div>
  )
}

interface PersonTableLabel extends TableLabelProps {
  roles: Role[]
  onClickRole: (id: number) => void
  roleField: RoleField
  activeId?: number
}

const PersonTableLabel: React.FC<PersonTableLabel> = ({text, disabled, showDeleteButton, roleField, roles, onClickRole, activeId} ) => {
  const [toggled, toggleMenu] = useState(false)
  const onOutsideClick = () => toggleMenu(value => !value)
  const ref = useOutsideClick<HTMLDivElement>(onOutsideClick)
  const popupStyle = roleField === 'evaluator'
    ? styles.tableLabelPopupEvaluator
    : styles.tableLabelPopup
  return (
    <div className={styles.tableLabel}>
      <button disabled={!!disabled} onClick={() => toggleMenu(state => !state)} className={classNames(styles.tableLabelButton, {[buttonStyles.selected]: toggled})}>{text}</button>
      {showDeleteButton && (
        <button className={buttonStyles.deleteButton} onClick={showDeleteButton.onClick} aria-label={showDeleteButton.ariaLabel} />
      )}
      {toggled && (
        <div className={popupStyle} ref={ref} >
          <ControlledSelectPanel roles={roles} onClickClose={onOutsideClick} onClickRole={onClickRole} roleField={roleField} activeId={activeId} />
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

const statusToColor: Record<HakemusArviointiStatus, PillProps['color']> = {
  accepted: 'green',
  rejected: 'red',
  plausible: 'yellow',
  unhandled: 'yellow',
  processing: 'blue',
}
function ArvioStatus({status}: {status: HakemusArviointiStatus}) {
  const text = HakemusArviointiStatuses.statusToFI(status)
  return <Pill color={statusToColor[status]} text={text} />
}

const muutoshakemusStatusToColor: Record<MuutoshakemusStatus, PillProps['color']> = {
  'accepted_with_changes': 'yellow',
  'accepted': 'green',
  'rejected': 'red',
  'new': 'blue',
}
function MuutoshakemusPill({status}: {status: MuutoshakemusStatus | undefined}) {
  if (!status) {
    return <EmptyGreyPill />
  }
  const statusToFI = Muutoshakemus.statusToFI(status)
  return <Pill color={muutoshakemusStatusToColor[status]} text={statusToFI} />
}

const valiselvitysStatusToColor: Record<SelvitysStatus, PillProps['color']> = {
  'accepted': 'green',
  'information_verified': 'green', // information_verified is just for loppuselvitys
  'missing': 'red',
  'submitted': 'yellow',
}
function ValiselvitysPill({status}: {status: SelvitysStatus | undefined}) {
  // TODO: check should use Loppuselvitys.statusToFi with this field instead
  if (!status || status === 'information_verified') {
    return <EmptyGreyPill />
  }
  const statusToFI = HakemusSelvitys.statusToFI(status)
  return <Pill color={valiselvitysStatusToColor[status]} text={statusToFI} />
}

const loppuselvitysStatusToColor: Record<SelvitysStatus, PillProps['color']> = {
  'accepted': 'green',
  'information_verified': 'blue',
  'missing': 'red',
  'submitted': 'blue',
}
function LoppuselvitysPill({status}: {status: SelvitysStatus | undefined}) {
  if (!status) {
    return <EmptyGreyPill />
  }
  const statusToFI = Loppuselvitys.statusToFI(status)
  return <Pill color={loppuselvitysStatusToColor[status]} text={statusToFI} />
}
