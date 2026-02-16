import React, { useEffect, useReducer, useState } from 'react'
import { Hakemus, HakemusArviointiStatus, SelvitysStatus } from 'soresu-form/web/va/types'

import * as styles from './HakemusListing.module.css'
import * as buttonStyles from '../../style/Button.module.css'
import { StarScoring } from './StarScoring'
import { TaydennyspyyntoIndikaattori } from './TaydennyspyyntoIndikaattori'
import { MuutoshakemusStatus } from 'soresu-form/web/va/types/muutoshakemus'
import { HakemusSelvitys, Loppuselvitys, Muutoshakemus } from 'soresu-form/web/va/status'
import HakemusArviointiStatuses from '../../HakemusArviointiStatuses'
import { Pill, PillProps } from '../../common-components/Pill'
import { HakemusFilter } from '../../types'

import useOutsideClick from '../../useOutsideClick'
import { isEvaluator, isPresenter, isPresenterRole, PersonSelectPanel } from './PersonSelectPanel'
import classNames from 'classnames'
import { ControlledSelectPanel, RoleField } from './ControlledSelectPanel'
import { AddRoleImage } from './AddRoleImage'
import { useHakemustenArviointiSelector } from '../arviointiStore'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { NavigateFunction, useNavigate, useSearchParams } from 'react-router-dom'
import { TAG_ID } from '../filterReducer'
import { useGetHakemusIdsHavingTaydennyspyyntoQuery } from '../../apiSlice'

interface Props {
  selectedHakemus: Hakemus | undefined
  hakemusList: Hakemus[]
  splitView: boolean
  isResolved: boolean
  additionalInfoOpen: boolean
}

type MuutoshakemusStatuses = (typeof Muutoshakemus.statuses)[number]
type ValiselvitysStatuses = (typeof HakemusSelvitys.statuses)[number]
type LoppuselvitysStatuses = (typeof Loppuselvitys.statuses)[number]

interface FilterState {
  status: {
    hakemus: readonly HakemusArviointiStatus[]
    muutoshakemus: readonly MuutoshakemusStatuses[]
    valiselvitys: readonly ValiselvitysStatuses[]
    loppuselvitys: readonly LoppuselvitysStatuses[]
  }
  organization: string
  projectNameOrCode: string
  presenter?: number
  evaluator?: number
}

type FilterKeys = keyof FilterState['status']
type Filters<FilterKey extends FilterKeys> = FilterState['status'][FilterKey]
type FilterValue<FilterKey extends FilterKeys> = FilterState['status'][FilterKey][number]

const SORTING_KEYS = [
  'organization',
  'registerNumber',
  'hakemus',
  'muutoshakemus',
  'valiselvitys',
  'loppuselvitys',
  'applied',
  'granted',
  'score',
] as const
type SortOrder = 'asc' | 'desc'
type SortKey = (typeof SORTING_KEYS)[number]
type SorterMap = {
  [k in SortKey]: (h: Hakemus) => number | string
}
type SortState = { sortKey: SortKey | undefined; sortOrder: SortOrder }

const sortValueMap: SorterMap = {
  organization: (h: Hakemus) => h['organization-name'],
  registerNumber: (h: Hakemus) => h['register-number'] ?? 'zzz',
  hakemus: (h: Hakemus) => h.arvio.status,
  muutoshakemus: (h: Hakemus) =>
    h.muutoshakemukset?.[0]?.status ?? h['status-muutoshakemus'] ?? 'zzz',
  valiselvitys: (h: Hakemus) => h['status-valiselvitys'],
  loppuselvitys: (h: Hakemus) => h['status-loppuselvitys'],
  applied: (h: Hakemus) => h['budget-oph-share'],
  granted: (h: Hakemus) => h.arvio['budget-granted'] ?? 0,
  score: (h: Hakemus) => h.arvio.scoring?.['score-total-average'] ?? 0,
}

const hakemusSorter =
  ({ sortKey, sortOrder }: SortState) =>
  (a: Hakemus, b: Hakemus): number => {
    const sortOrderCoef = sortOrder === 'asc' ? -1 : 1
    const sortResult = sortKey && sortValueMap[sortKey](a) > sortValueMap[sortKey](b) ? 1 : -1
    return sortOrderCoef * sortResult
  }

type StatusFilterAction<Filter extends FilterKeys> =
  | { type: `set-status-filter`; filter: Filter; value: FilterValue<Filter> }
  | { type: `set-status-filters`; filter: Filter; value: Filters<Filter> }
  | { type: `unset-status-filter`; filter: Filter; value: FilterValue<Filter> }
  | { type: `clear-status-filter`; filter: Filter }

type Action =
  | { type: 'set-organization-name-filter'; value: string }
  | { type: 'set-project-name-filter'; value: string }
  | { type: 'set-evaluator-filter'; id?: number }
  | { type: 'set-presenter-filter'; id?: number }
  | { type: 'set-sorting'; key: SortKey }
  | StatusFilterAction<'hakemus'>
  | StatusFilterAction<'valiselvitys'>
  | StatusFilterAction<'loppuselvitys'>
  | StatusFilterAction<'muutoshakemus'>

const hakemusFilter = (state: FilterState) => (hakemus: Hakemus) => {
  const organizationNameOk = hakemus['organization-name']
    .toLocaleLowerCase()
    .includes(state.organization)
  const projectNameOrRegisternumberOk = (hakemus['project-name'] + hakemus['register-number'] || '')
    .toLocaleLowerCase()
    .includes(state.projectNameOrCode)
  const hakemusStatusOK =
    state.status.hakemus.length > 0 && state.status.hakemus.includes(hakemus.arvio.status)
  const muutoshakemusStatusOk =
    state.status.muutoshakemus.length > 0 && hakemus['status-muutoshakemus']
      ? state.status.muutoshakemus.includes(hakemus['status-muutoshakemus'])
      : true
  const valiselvitysStatusOk =
    state.status.valiselvitys.length > 0 && hakemus['status-valiselvitys']
      ? hakemus['status-valiselvitys'] === 'information_verified' ||
        state.status.valiselvitys.includes(hakemus['status-valiselvitys'])
      : true
  const loppuselvitysStatusOk =
    state.status.loppuselvitys.length > 0 && hakemus['status-loppuselvitys']
      ? state.status.loppuselvitys.includes(hakemus['status-loppuselvitys'])
      : true
  const evaluatorOk =
    state.evaluator !== undefined ? isEvaluator(hakemus, { id: state.evaluator }) : true
  const presenterOk =
    state.presenter !== undefined ? isPresenter(hakemus, { id: state.presenter }) : true
  return (
    organizationNameOk &&
    projectNameOrRegisternumberOk &&
    hakemusStatusOK &&
    muutoshakemusStatusOk &&
    valiselvitysStatusOk &&
    loppuselvitysStatusOk &&
    evaluatorOk &&
    presenterOk
  )
}

const answerFilter = (hakemusFilter: HakemusFilter) => (hakemus: Hakemus) => {
  const idsWithOwnFilter: string[] = [TAG_ID]
  const answers = hakemusFilter.answers.filter((a) => !idsWithOwnFilter.includes(a.id))

  if (!answers.length) {
    return true
  }

  const filtersGroupedById = answers.reduce<{ [id: string]: string[] }>((prev, cur) => {
    if (Object.keys(prev).includes(cur.id)) {
      return {
        ...prev,
        [cur.id]: [...prev[cur.id], cur.answer],
      }
    } else {
      return {
        ...prev,
        [cur.id]: [cur.answer],
      }
    }
  }, {})

  return Object.keys(filtersGroupedById).every((key) => {
    const filterAnswers = filtersGroupedById[key]
    const hakemusAnswer = hakemus.answers.find((a) => a.key === key)
    return filterAnswers.includes(hakemusAnswer?.value)
  })
}

const tagFilter = (hakemusFilter: HakemusFilter) => (hakemus: Hakemus) => {
  const tags = hakemusFilter.answers.filter((a) => a.id === TAG_ID).map((a) => a.answer)
  if (!tags.length) {
    return true
  }
  return hakemus.arvio.tags?.value.some((t) => tags.includes(t))
}

const defaultStatusFilters = {
  hakemus: HakemusArviointiStatuses.statuses,
  muutoshakemus: Muutoshakemus.statuses,
  valiselvitys: HakemusSelvitys.statuses,
  loppuselvitys: Loppuselvitys.statuses,
} as const

const reducer = (state: FilterState, action: Action): FilterState => {
  switch (action.type) {
    case 'set-organization-name-filter':
      return { ...state, organization: action.value }
    case 'set-project-name-filter':
      return { ...state, projectNameOrCode: action.value }
    case 'set-status-filter': {
      return {
        ...state,
        status: {
          ...state.status,
          [action.filter]: [...state.status[action.filter], action.value],
        },
      }
    }
    case 'set-status-filters': {
      return {
        ...state,
        status: {
          ...state.status,
          [action.filter]: action.value,
        },
      }
    }
    case 'unset-status-filter': {
      const cloned = [...state.status[action.filter]]
      return {
        ...state,
        status: {
          ...state.status,
          [action.filter]: cloned.filter((s) => s !== action.value),
        },
      }
    }
    case 'clear-status-filter': {
      return {
        ...state,
        status: {
          ...state.status,
          [action.filter]: [...defaultStatusFilters[action.filter]],
        },
      }
    }
    case 'set-evaluator-filter': {
      return { ...state, evaluator: action.id }
    }
    case 'set-presenter-filter': {
      return { ...state, presenter: action.id }
    }
    default:
      throw Error('unknown action')
  }
}

const getDefaultState = (isResolved: boolean): FilterState => ({
  status: {
    ...defaultStatusFilters,
    hakemus: isResolved
      ? defaultStatusFilters.hakemus.filter((s) => s !== 'rejected')
      : defaultStatusFilters.hakemus,
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

export default function HakemusListing(props: Props) {
  const { selectedHakemus, hakemusList, splitView, isResolved, additionalInfoOpen } = props
  const [showUkotusModalForHakemusId, setShowUkotusModal] = useState<number | undefined>(undefined)
  const [ukotusAnchorElement, setUkotusAnchorElement] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (ukotusAnchorElement) {
      ukotusAnchorElement.style.setProperty('anchor-name', '--ukotus-anchor')
    }
    return () => {
      if (ukotusAnchorElement) {
        ukotusAnchorElement.style.removeProperty('anchor-name')
      }
    }
  }, [ukotusAnchorElement])
  const toggleUkotusModal = (
    selectedHakemusId: number | undefined,
    anchorElement?: HTMLElement | null
  ) => {
    setShowUkotusModal(selectedHakemusId)
    setUkotusAnchorElement(selectedHakemusId !== undefined ? (anchorElement ?? null) : null)
  }

  const hakemusFilterState = useHakemustenArviointiSelector((state) => state.filter)
  const selectedHakemusId = selectedHakemus ? selectedHakemus.id : undefined
  const [filterState, dispatch] = useReducer(reducer, getDefaultState(isResolved))
  useEffect(() => {
    dispatch({
      type: 'set-status-filters',
      filter: 'hakemus',
      value: getDefaultState(isResolved).status.hakemus,
    })
  }, [isResolved])
  const [sortingState, setSorting] = useSorting()
  const filteredList = hakemusList
    .filter(hakemusFilter(filterState))
    .filter(answerFilter(hakemusFilterState))
    .filter(tagFilter(hakemusFilterState))
    .sort(hakemusSorter(sortingState))
  const totalBudgetGranted = filteredList.reduce<number>((totalGranted, hakemus) => {
    const granted = hakemus.arvio['budget-granted']
    if (!granted) {
      return totalGranted
    }
    return totalGranted + granted
  }, 0)
  const containerClass =
    selectedHakemus && splitView
      ? additionalInfoOpen
        ? styles.smallFixedContainer
        : styles.largeFixedContainer
      : styles.tableContainer
  const onYhteenvetoClick = async (avustushakuId?: number) => {
    if (avustushakuId === undefined) {
      return
    }
    const savedSearchResponse = await HttpUtil.put(`/api/avustushaku/${avustushakuId}/searches`, {
      'hakemus-ids': filteredList.map((h) => h.id),
    })
    window.localStorage.setItem('va.arviointi.admin.summary.url', savedSearchResponse['search-url'])
  }
  const ukotusHakemus = showUkotusModalForHakemusId
    ? hakemusList.find((h) => h.id === showUkotusModalForHakemusId)
    : undefined

  const navigate = useNavigate()
  const changeHakemus = (navigate: NavigateFunction) => (hakemusId: number) => {
    navigate(`hakemus/${hakemusId}/arviointi${window.location.search}`)
    if (showUkotusModalForHakemusId !== undefined) {
      const anchor = document.querySelector(
        `[data-ukotus-presenter-id="${hakemusId}"]`
      ) as HTMLElement | null
      toggleUkotusModal(hakemusId, anchor)
    }
  }
  const onHakemusClick = changeHakemus(navigate)
  return (
    <div className={styles.containerForModals}>
      <div className={styles.ukotusModalContainer}>
        {ukotusHakemus && (
          <PersonSelectPanel hakemus={ukotusHakemus} toggleUkotusModal={toggleUkotusModal} />
        )}
      </div>
      <div id="hakemus-listing" className={containerClass}>
        {isResolved ? (
          <ResolvedTable
            selectedHakemusId={selectedHakemusId}
            onYhteenvetoClick={onYhteenvetoClick}
            filterState={filterState}
            filteredList={filteredList}
            list={hakemusList}
            dispatch={dispatch}
            totalBudgetGranted={totalBudgetGranted}
            sortingState={sortingState}
            setSorting={setSorting}
            toggleUkotusModal={toggleUkotusModal}
            onHakemusClick={onHakemusClick}
          />
        ) : (
          <HakemusTable
            selectedHakemusId={selectedHakemusId}
            onYhteenvetoClick={onYhteenvetoClick}
            filterState={filterState}
            filteredList={filteredList}
            list={hakemusList}
            dispatch={dispatch}
            totalBudgetGranted={totalBudgetGranted}
            sortingState={sortingState}
            setSorting={setSorting}
            toggleUkotusModal={toggleUkotusModal}
            onHakemusClick={onHakemusClick}
          />
        )}
      </div>
    </div>
  )
}

interface HakemusTableProps {
  selectedHakemusId: number | undefined
  filterState: FilterState
  list: Hakemus[]
  filteredList: Hakemus[]
  dispatch: React.Dispatch<Action>
  onYhteenvetoClick: (avustushakuId?: number) => void
  totalBudgetGranted: number
  setSorting: (sortKey?: SortKey) => void
  sortingState: SortState
  toggleUkotusModal: (hakemusId: number | undefined, anchorElement?: HTMLElement | null) => void
  onHakemusClick: (hakemusId: number) => void
}

function hakemusModifiedAfterSubmitted(hakemus: Hakemus) {
  return hakemus['submitted-version'] && hakemus['submitted-version'] !== hakemus.version
}

function HakemusTable({
  dispatch,
  filterState,
  list,
  filteredList,
  selectedHakemusId,
  onYhteenvetoClick,
  totalBudgetGranted,
  sortingState,
  setSorting,
  toggleUkotusModal,
  onHakemusClick,
}: HakemusTableProps) {
  const avustushakuId = useHakemustenArviointiSelector(
    (state) => state.arviointi.avustushakuData?.hakuData.avustushaku.id
  )
  const allowHakemusScoring = useHakemustenArviointiSelector(
    (state) => state.arviointi.avustushakuData?.hakuData.privileges['score-hakemus'] === true
  )
  const { data: hakemuksetWithTaydennyspyynto = [] } = useGetHakemusIdsHavingTaydennyspyyntoQuery(
    avustushakuId ?? 0,
    { skip: avustushakuId === undefined }
  )
  const onOrganizationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'set-organization-name-filter',
      value: event.target.value,
    })
  }
  const onProjectInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'set-project-name-filter', value: event.target.value })
  }
  const totalOphShare = filteredList.reduce((total, hakemus) => {
    const ophShare = hakemus['budget-oph-share']
    return total + ophShare
  }, 0)
  const { organization, projectNameOrCode, status: statusFilter } = filterState
  return (
    <table className={`${styles.table} hakemus-list`}>
      <colgroup>
        <col style={{ width: '216px' }} />
        <col style={{ width: '210px' }} />
        <col style={{ width: '100px' }} />
        <col style={{ width: '136px' }} />
        <col style={{ width: '80px' }} />
        <col style={{ width: '80px' }} />
        <col style={{ width: '80px' }} />
        <col style={{ width: '95px' }} />
      </colgroup>
      <thead>
        <tr>
          <th>
            <div className={styles.tableHeader}>
              <input
                placeholder="Hakijaorganisaatio"
                onChange={onOrganizationInput}
                value={organization}
              />
              <SortButton
                sortKey="organization"
                sortingState={sortingState}
                setSorting={setSorting}
                text="hakijaorganisaatio"
              />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <input
                placeholder="Asiatunnus tai hanke"
                onChange={onProjectInput}
                value={projectNameOrCode}
              />
              <SortButton
                sortKey="registerNumber"
                sortingState={sortingState}
                setSorting={setSorting}
                text="asianumero"
              />
            </div>
          </th>
          <th>
            <div className="tyhjäTäydennyspyyntöTableHeader"></div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <TableLabel text="Arvio" disabled />
              <SortButton
                sortKey="score"
                sortingState={sortingState}
                setSorting={setSorting}
                text="arvio"
              />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Tila"
                statuses={HakemusArviointiStatuses.statuses}
                labelText={HakemusArviointiStatuses.statusToFI}
                isChecked={(status) => statusFilter.hakemus.includes(status)}
                onCheck={(status) =>
                  dispatch({
                    type: 'set-status-filter',
                    filter: 'hakemus',
                    value: status,
                  })
                }
                onUncheck={(status) =>
                  dispatch({
                    type: 'unset-status-filter',
                    filter: 'hakemus',
                    value: status,
                  })
                }
                amountOfStatus={(status) => list.filter((h) => h.arvio.status === status).length}
                showDeleteButton={
                  statusFilter.hakemus.length !== HakemusArviointiStatuses.statuses.length
                    ? {
                        ariaLabel: 'Poista hakemuksen tila rajaukset',
                        onClick: () =>
                          dispatch({
                            type: 'clear-status-filter',
                            filter: 'hakemus',
                          }),
                      }
                    : undefined
                }
              />
              <SortButton
                sortKey="hakemus"
                setSorting={setSorting}
                sortingState={sortingState}
                text="hakemuksen tila"
              />
            </div>
          </th>
          <th className={`${styles.sumColumn} applied-sum-column`}>
            <div className={styles.tableHeader}>
              <TableLabel text="Haettu" disabled />
              <SortButton
                sortKey="applied"
                sortingState={sortingState}
                setSorting={setSorting}
                text="haettu summa"
              />
            </div>
          </th>
          <th className={`${styles.sumColumn} granted-sum-column`}>
            <div className={styles.tableHeader}>
              <TableLabel text="Myönnetty" disabled />
              <SortButton
                sortKey="granted"
                sortingState={sortingState}
                setSorting={setSorting}
                text="myönnetty summa"
              />
            </div>
          </th>
          <th>
            <PersonTableLabel
              text="Valmistelija"
              roleField="presenter"
              onClickRole={(id) => dispatch({ type: 'set-presenter-filter', id })}
              activeId={filterState.presenter}
              showDeleteButton={
                filterState.presenter !== undefined
                  ? {
                      onClick: () =>
                        dispatch({
                          type: 'set-presenter-filter',
                          id: undefined,
                        }),
                      ariaLabel: 'Poista valmistelija rajaus',
                    }
                  : undefined
              }
            />
          </th>
          <th>
            <PersonTableLabel
              text="Arvioija"
              roleField="evaluator"
              onClickRole={(id) => dispatch({ type: 'set-evaluator-filter', id })}
              activeId={filterState.evaluator}
              showDeleteButton={
                filterState.evaluator !== undefined
                  ? {
                      onClick: () =>
                        dispatch({
                          type: 'set-evaluator-filter',
                          id: undefined,
                        }),
                      ariaLabel: 'Poista arvioija rajaus',
                    }
                  : undefined
              }
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredList.map((hakemus) => {
          const modified = hakemusModifiedAfterSubmitted(hakemus)
          const draft = hakemus.status === 'draft'
          const scoring = hakemus.arvio.scoring
          const onRoleButtonClick = (
            _hakemusId: number | undefined,
            anchorElement?: HTMLElement | null
          ) => {
            toggleUkotusModal(hakemus.id, anchorElement)
          }
          return (
            <tr
              key={`hakemus-${hakemus.id}`}
              className={classNames(
                hakemus.id === selectedHakemusId ? styles.selectedHakemusRow : styles.hakemusRow,
                { [styles.draft]: draft }
              )}
              tabIndex={0}
              onClick={() => {
                onHakemusClick(hakemus.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onHakemusClick(hakemus.id)
                }
              }}
              data-test-id={`hakemus-${hakemus.id}`}
            >
              <td className="organization-cell">{hakemus['organization-name']}</td>
              <td className="project-name-cell">
                <div className={styles.projectTd}>
                  {getProject(hakemus)}
                  {modified && (
                    <Pill
                      color="blue"
                      testId={`${hakemus.id}-modified-pill`}
                      text="Muokattu"
                      compact
                    />
                  )}
                  {draft && <Pill color="yellow" text="Keskeneräinen" compact />}
                </div>
              </td>
              <td>
                <TaydennyspyyntoIndikaattori
                  hakemusId={hakemus.id}
                  pendingChangeRequest={hakemus.status === 'pending_change_request'}
                  hakemukselleLahetettyTaydennyspyynto={hakemuksetWithTaydennyspyynto.includes(
                    hakemus.id
                  )}
                />
              </td>
              <td className={styles.starsCell}>
                <StarScoring
                  id={hakemus.id}
                  allowHakemusScoring={allowHakemusScoring}
                  scoring={scoring}
                />
              </td>
              <td className="hakemus-status-cell" data-test-class="hakemus-status-cell">
                {draft ? (
                  <EmptyGreyPill />
                ) : (
                  <ArvioStatus
                    status={hakemus.arvio.status}
                    refused={hakemus.refused}
                    keskeytettyAloittamatta={hakemus['keskeytetty-aloittamatta']}
                  />
                )}
              </td>
              <td
                className={`${styles.alignRight} ${styles.sumColumn} applied-sum-column applied-sum-cell`}
              >
                {euroFormatter.format(hakemus['budget-oph-share'])}
              </td>
              <td
                className={`${styles.alignRight} ${styles.sumColumn} granted-sum-column granted-sum-cell`}
                data-test-class="granted-sum-cell"
              >
                {hakemus.arvio['budget-granted']
                  ? euroFormatter.format(hakemus.arvio['budget-granted'])
                  : '-'}
              </td>
              <td>
                <PeopleRoleButton
                  hakemus={hakemus}
                  selectedRole="presenter"
                  toggleUkotusModal={onRoleButtonClick}
                />
              </td>
              <td>
                <PeopleRoleButton
                  hakemus={hakemus}
                  selectedRole="evaluators"
                  toggleUkotusModal={onRoleButtonClick}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={4}>
            {filteredList.length}/{list.length} hakemusta
            <a
              className={styles.yhteenveto}
              href="/yhteenveto/"
              target="_blank"
              onClick={() => onYhteenvetoClick(avustushakuId)}
            >
              Päätöslista
            </a>
          </td>
          <td colSpan={1} className={`${styles.alignRight} ${styles.sumColumn} applied-sum-column`}>
            {euroFormatter.format(totalOphShare)}
          </td>
          <td colSpan={1} className={`${styles.alignRight} ${styles.sumColumn} granted-sum-column`}>
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
  onYhteenvetoClick: (avustushakuId?: number) => void
  totalBudgetGranted: number
  setSorting: (sortKey?: SortKey) => void
  sortingState: SortState
  toggleUkotusModal: (hakemusId: number | undefined, anchorElement?: HTMLElement | null) => void
  onHakemusClick: (hakemusId: number) => void
}

function ResolvedTable(props: ResolvedTableProps) {
  const {
    selectedHakemusId,
    filterState,
    dispatch,
    onYhteenvetoClick,
    filteredList,
    list,
    totalBudgetGranted,
    setSorting,
    sortingState,
    toggleUkotusModal,
    onHakemusClick,
  } = props
  const avustushakuId = useHakemustenArviointiSelector(
    (state) => state.arviointi.avustushakuData?.hakuData.avustushaku.id
  )
  const onOrganizationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'set-organization-name-filter',
      value: event.target.value,
    })
  }
  const onProjectInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'set-project-name-filter', value: event.target.value })
  }
  const { projectNameOrCode, organization, status: statusFilter } = filterState

  return (
    <table className={`${styles.table} hakemus-list`}>
      <colgroup>
        <col style={{ width: '186px' }} />
        <col style={{ width: '210px' }} />
        <col style={{ width: '106px' }} />
        <col style={{ width: '136px' }} />
        <col style={{ width: '136px' }} />
        <col style={{ width: '136px' }} />
        <col style={{ width: '80px' }} />
        <col style={{ width: '84px' }} />
        <col style={{ width: '59px' }} />
      </colgroup>
      <thead>
        <tr>
          <th>
            <div className={styles.tableHeader}>
              <input
                placeholder="Hakijaorganisaatio"
                onChange={onOrganizationInput}
                value={organization}
              />
              <SortButton
                sortKey="organization"
                setSorting={setSorting}
                sortingState={sortingState}
                text="hakijaorganisaatio"
              />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <input
                placeholder="Asiatunnus tai hanke"
                onChange={onProjectInput}
                value={projectNameOrCode}
              />
              <SortButton
                sortKey="registerNumber"
                setSorting={setSorting}
                sortingState={sortingState}
                text="asianumero"
              />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Tila"
                statuses={HakemusArviointiStatuses.statuses}
                labelText={HakemusArviointiStatuses.statusToFI}
                isChecked={(status) => statusFilter.hakemus.includes(status)}
                onCheck={(status) =>
                  dispatch({
                    type: 'set-status-filter',
                    filter: 'hakemus',
                    value: status,
                  })
                }
                onUncheck={(status) =>
                  dispatch({
                    type: 'unset-status-filter',
                    filter: 'hakemus',
                    value: status,
                  })
                }
                amountOfStatus={(status) => list.filter((h) => h.arvio.status === status).length}
                showDeleteButton={
                  statusFilter.hakemus.length !== HakemusArviointiStatuses.statuses.length
                    ? {
                        ariaLabel: 'Poista hakemuksen tila rajaukset',
                        onClick: () =>
                          dispatch({
                            type: 'clear-status-filter',
                            filter: 'hakemus',
                          }),
                      }
                    : undefined
                }
              />
              <SortButton
                sortKey="hakemus"
                setSorting={setSorting}
                sortingState={sortingState}
                text="hakemuksen tila"
              />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Muutoshakemus"
                statuses={Muutoshakemus.statuses}
                labelText={Muutoshakemus.statusToFI}
                isChecked={(status) => statusFilter.muutoshakemus.includes(status)}
                onCheck={(status) =>
                  dispatch({
                    type: 'set-status-filter',
                    filter: 'muutoshakemus',
                    value: status,
                  })
                }
                onUncheck={(status) =>
                  dispatch({
                    type: 'unset-status-filter',
                    filter: 'muutoshakemus',
                    value: status,
                  })
                }
                amountOfStatus={(status) =>
                  list.filter((h) => h['status-muutoshakemus'] === status).length
                }
                showDeleteButton={
                  statusFilter.muutoshakemus.length !== Muutoshakemus.statuses.length
                    ? {
                        ariaLabel: 'Poista muutoshakemus rajaukset',
                        onClick: () =>
                          dispatch({
                            type: 'clear-status-filter',
                            filter: 'muutoshakemus',
                          }),
                      }
                    : undefined
                }
              />
              <SortButton
                sortKey="muutoshakemus"
                setSorting={setSorting}
                sortingState={sortingState}
                text="muutoshakemuksen tila"
              />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Väliselvitys"
                statuses={HakemusSelvitys.statuses}
                labelText={HakemusSelvitys.statusToFI}
                isChecked={(status) => statusFilter.valiselvitys.includes(status)}
                onCheck={(status) =>
                  dispatch({
                    type: 'set-status-filter',
                    filter: 'valiselvitys',
                    value: status,
                  })
                }
                onUncheck={(status) =>
                  dispatch({
                    type: 'unset-status-filter',
                    filter: 'valiselvitys',
                    value: status,
                  })
                }
                amountOfStatus={(status) =>
                  list.filter((h) => h['status-valiselvitys'] === status).length
                }
                showDeleteButton={
                  statusFilter.valiselvitys.length !== HakemusSelvitys.statuses.length
                    ? {
                        ariaLabel: 'Poista väliselvitys rajaukset',
                        onClick: () =>
                          dispatch({
                            type: 'clear-status-filter',
                            filter: 'valiselvitys',
                          }),
                      }
                    : undefined
                }
              />
              <SortButton
                sortKey="valiselvitys"
                setSorting={setSorting}
                sortingState={sortingState}
                text="väliselvityksen tila"
              />
            </div>
          </th>
          <th>
            <div className={styles.tableHeader}>
              <StatusTableLabel
                text="Loppuselvitys"
                statuses={Loppuselvitys.statuses}
                labelText={Loppuselvitys.statusToFI}
                isChecked={(status) => statusFilter.loppuselvitys.includes(status)}
                onCheck={(status) =>
                  dispatch({
                    type: 'set-status-filter',
                    filter: 'loppuselvitys',
                    value: status,
                  })
                }
                onUncheck={(status) =>
                  dispatch({
                    type: 'unset-status-filter',
                    filter: 'loppuselvitys',
                    value: status,
                  })
                }
                amountOfStatus={(status) =>
                  list.filter((h) => h['status-loppuselvitys'] === status).length
                }
                showDeleteButton={
                  statusFilter.loppuselvitys.length !== Loppuselvitys.statuses.length
                    ? {
                        ariaLabel: 'Poista loppuselvitys rajaukset',
                        onClick: () =>
                          dispatch({
                            type: 'clear-status-filter',
                            filter: 'loppuselvitys',
                          }),
                      }
                    : undefined
                }
              />
              <SortButton
                sortKey="loppuselvitys"
                setSorting={setSorting}
                sortingState={sortingState}
                text="loppuselvityksen tila"
              />
            </div>
          </th>
          <th className={`${styles.sumColumn} granted-sum-column`}>
            <div className={styles.tableHeader}>
              <TableLabel text="Myönnetty" disabled />
              <SortButton
                sortKey="granted"
                setSorting={setSorting}
                sortingState={sortingState}
                text="myönnetty summa"
              />
            </div>
          </th>
          <th>
            <PersonTableLabel
              text="Valmistelija"
              roleField="presenter"
              onClickRole={(id) => dispatch({ type: 'set-presenter-filter', id })}
              activeId={filterState.presenter}
              showDeleteButton={
                filterState.presenter !== undefined
                  ? {
                      onClick: () =>
                        dispatch({
                          type: 'set-presenter-filter',
                          id: undefined,
                        }),
                      ariaLabel: 'Poista valmistelija rajaus',
                    }
                  : undefined
              }
            />
          </th>
          <th>
            <PersonTableLabel
              text="Arvioija"
              roleField="evaluator"
              onClickRole={(id) => dispatch({ type: 'set-evaluator-filter', id })}
              activeId={filterState.evaluator}
              showDeleteButton={
                filterState.evaluator !== undefined
                  ? {
                      onClick: () =>
                        dispatch({
                          type: 'set-evaluator-filter',
                          id: undefined,
                        }),
                      ariaLabel: 'Poista arvioija rajaus',
                    }
                  : undefined
              }
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredList.map((hakemus) => {
          const onRoleButtonClick = (
            _hakemusId: number | undefined,
            anchorElement?: HTMLElement | null
          ) => {
            toggleUkotusModal(hakemus.id, anchorElement)
          }
          return (
            <tr
              key={`hakemus-${hakemus.id}`}
              className={
                hakemus.id === selectedHakemusId ? styles.selectedHakemusRow : styles.hakemusRow
              }
              tabIndex={0}
              onClick={() => {
                onHakemusClick(hakemus.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onHakemusClick(hakemus.id)
                }
              }}
              data-test-id={`hakemus-${hakemus.id}`}
            >
              <td>
                <div className={styles.organizationCell}>
                  {hakemus['organization-name']}
                  {
                    <TaydennyspyyntoIndikaattori
                      hakemusId={hakemus.id}
                      pendingChangeRequest={!!hakemus['loppuselvitys-change-request-pending']}
                      hakemukselleLahetettyTaydennyspyynto={
                        !!hakemus['loppuselvitys-change-request-sent']
                      }
                    />
                  }
                </div>
              </td>
              <td className="project-name-cell">{getProject(hakemus)}</td>
              <td className="hakemus-status-cell" data-test-class="hakemus-status-cell">
                <ArvioStatus
                  status={hakemus.arvio.status}
                  refused={hakemus.refused}
                  keskeytettyAloittamatta={hakemus['keskeytetty-aloittamatta']}
                />
              </td>
              <td data-test-class="muutoshakemus-status-cell">
                <MuutoshakemusPill
                  status={hakemus['status-muutoshakemus']}
                  refused={hakemus.refused}
                />
              </td>
              <td data-test-class="valiselvitys-status-cell">
                <ValiselvitysPill
                  status={hakemus['status-valiselvitys']}
                  refused={hakemus.refused}
                />
              </td>
              <td data-test-class="loppuselvitys-status-cell">
                <LoppuselvitysPill
                  status={hakemus['status-loppuselvitys']}
                  refused={hakemus.refused}
                />
              </td>
              <td
                className={`${styles.alignRight} ${styles.sumColumn} granted-sum-column granted-sum-cell`}
                data-test-class="granted-sum-cell"
              >
                {hakemus.arvio['budget-granted']
                  ? euroFormatter.format(hakemus.arvio['budget-granted'])
                  : '-'}
              </td>
              <td>
                <PeopleRoleButton
                  hakemus={hakemus}
                  selectedRole="presenter"
                  toggleUkotusModal={onRoleButtonClick}
                />
              </td>
              <td>
                <PeopleRoleButton
                  hakemus={hakemus}
                  selectedRole="evaluators"
                  toggleUkotusModal={onRoleButtonClick}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={6}>
            {filteredList.length}/{list.length} hakemusta
            <a
              className={styles.yhteenveto}
              href="/yhteenveto/"
              target="_blank"
              onClick={() => onYhteenvetoClick(avustushakuId)}
            >
              Päätöslista
            </a>
          </td>
          <td colSpan={1} className={`${styles.alignRight} ${styles.sumColumn} granted-sum-column`}>
            {totalBudgetGranted > 0 ? euroFormatter.format(totalBudgetGranted) : '-'}
          </td>
          <td colSpan={2} />
        </tr>
      </tfoot>
    </table>
  )
}

const getProject = (hakemus: Hakemus) => {
  const registerNumber = hakemus['register-number'] ?? ''
  const projectName = hakemus['project-name']
  const combined = `${registerNumber} ${projectName}`.trim()
  return (
    <div title={combined} aria-label={combined} className={styles.project}>
      {registerNumber.length > 0 && <span>{registerNumber}</span>}
      <span>{projectName}</span>
    </div>
  )
}

interface PeopleRoleButton {
  hakemus: Hakemus
  selectedRole: 'evaluators' | 'presenter'
  toggleUkotusModal: (hakemusId: number | undefined, anchorElement?: HTMLElement | null) => void
}

const PeopleRoleButton = ({ selectedRole, hakemus, toggleUkotusModal }: PeopleRoleButton) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const hakuData = useHakemustenArviointiSelector(
    (state) => state.arviointi.avustushakuData?.hakuData
  )
  const onClickCallback = async (e: React.SyntheticEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    searchParams.set('splitView', 'true')
    setSearchParams(searchParams)
    toggleUkotusModal(hakemus.id, e.currentTarget)
  }
  const presentersWanted = selectedRole === 'presenter'
  const filteredRoles =
    hakuData?.roles.filter((role) =>
      presentersWanted
        ? isPresenterRole(role) && isPresenter(hakemus, role)
        : isEvaluator(hakemus, role)
    ) ?? []
  const title = filteredRoles.map((f) => f.name).join('\n')
  const buttonInitials = filteredRoles
    .map(({ name }) =>
      name.split(/\s+/).reduce((initials, name) => initials + name.slice(0, 1), '')
    )
    .join(', ')
  const disallowChangeHakemusState = !hakuData?.privileges['change-hakemus-state']
  const ariaLabel = presentersWanted
    ? 'Lisää valmistelija hakemukselle'
    : 'Lisää arvioija hakemukselle'
  return (
    <div
      className={styles.roleContainer}
      {...(presentersWanted ? { 'data-ukotus-presenter-id': String(hakemus.id) } : {})}
    >
      {buttonInitials.length === 0 ? (
        <button
          aria-label={ariaLabel}
          disabled={disallowChangeHakemusState}
          className={styles.addRoleButton}
          onClick={onClickCallback}
          title={title}
        >
          <AddRoleImage disabled={disallowChangeHakemusState} />
        </button>
      ) : (
        <button
          aria-label={ariaLabel}
          disabled={disallowChangeHakemusState}
          className={styles.roleButton}
          onClick={onClickCallback}
          title={title}
        >
          {buttonInitials}
        </button>
      )}
    </div>
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
  children?: React.ReactNode
}

const TableLabel: React.FC<TableLabelProps> = ({ text, disabled, showDeleteButton, children }) => {
  const [toggled, toggleMenu] = useState(false)
  const onOutsideClick = () => toggleMenu((value) => !value)
  const ref = useOutsideClick<HTMLDivElement>(onOutsideClick)
  return (
    <div
      className={classNames(styles.tableLabel, {
        [styles.tableLabelStatic]: disabled,
      })}
    >
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
  )
}

interface PersonTableLabel extends TableLabelProps {
  onClickRole: (id: number) => void
  roleField: RoleField
  activeId?: number
}

const PersonTableLabel: React.FC<PersonTableLabel> = ({
  text,
  disabled,
  showDeleteButton,
  roleField,
  onClickRole,
  activeId,
}) => {
  const [toggled, toggleMenu] = useState(false)
  const onOutsideClick = () => toggleMenu((value) => !value)
  const ref = useOutsideClick<HTMLDivElement>(onOutsideClick)
  const popupStyle =
    roleField === 'evaluator' ? styles.tableLabelPopupEvaluator : styles.tableLabelPopup
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
        <div className={popupStyle} ref={ref}>
          <ControlledSelectPanel
            onClickClose={onOutsideClick}
            onClickRole={onClickRole}
            roleField={roleField}
            activeId={activeId}
          />
        </div>
      )}
    </div>
  )
}

type Statuses =
  | HakemusArviointiStatus
  | MuutoshakemusStatuses
  | ValiselvitysStatuses
  | LoppuselvitysStatuses

interface StatusTableLabelProps<Status extends Statuses> extends TableLabelProps {
  statuses: readonly Status[]
  labelText: (status: Status) => string
  isChecked: (status: Status) => boolean
  onCheck: (status: Status) => void
  onUncheck: (status: Status) => void
  amountOfStatus: (status: Status) => number
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
        const checked = isChecked(status)
        return (
          <div key={`muutoshakemus-status-${status}`} className={styles.statusCheckbox}>
            <input
              type="checkbox"
              id={status}
              checked={checked}
              onChange={() => {
                if (checked) {
                  onUncheck(status)
                } else {
                  onCheck(status)
                }
              }}
            />
            <label htmlFor={status}>
              {labelText(status)} ({amountOfStatus(status)})
            </label>
          </div>
        )
      })}
    </TableLabel>
  )
}

const euroFormatter = new Intl.NumberFormat('fi-FI', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const EmptyGreyPill = () => <Pill color="grey" text="-" />

const statusToColor: Record<HakemusArviointiStatus, PillProps['color']> = {
  accepted: 'green',
  rejected: 'red',
  plausible: 'yellow',
  unhandled: 'yellow',
  processing: 'blue',
}

function ArvioStatus({
  status,
  refused,
  keskeytettyAloittamatta,
}: {
  status: HakemusArviointiStatus
  refused: boolean | undefined
  keskeytettyAloittamatta: boolean | undefined
}) {
  if (refused) {
    return <Pill color="yellow" text={keskeytettyAloittamatta ? 'Kesk. aloitt.' : 'Ei tarvetta'} />
  }
  const text = HakemusArviointiStatuses.statusToFI(status)
  return <Pill color={statusToColor[status]} text={text} />
}

const muutoshakemusStatusToColor: Record<MuutoshakemusStatus, PillProps['color']> = {
  accepted_with_changes: 'yellow',
  accepted: 'green',
  rejected: 'red',
  new: 'blue',
}

function MuutoshakemusPill({
  status,
  refused,
}: {
  status: MuutoshakemusStatus | undefined
  refused: boolean | undefined
}) {
  if (!status || refused) {
    return <EmptyGreyPill />
  }
  const statusToFI = Muutoshakemus.statusToFI(status)
  return <Pill color={muutoshakemusStatusToColor[status]} text={statusToFI} />
}

const valiselvitysStatusToColor: Record<SelvitysStatus, PillProps['color']> = {
  accepted: 'green',
  information_verified: 'green', // information_verified is just for loppuselvitys
  missing: 'red',
  submitted: 'yellow',
}

function ValiselvitysPill({
  status,
  refused,
}: {
  status: SelvitysStatus | undefined
  refused: boolean | undefined
}) {
  if (!status || status === 'information_verified' || refused) {
    return <EmptyGreyPill />
  }
  const statusToFI = HakemusSelvitys.statusToFI(status)
  return <Pill color={valiselvitysStatusToColor[status]} text={statusToFI} />
}

const loppuselvitysStatusToColor: Record<SelvitysStatus, PillProps['color']> = {
  accepted: 'green',
  information_verified: 'blue',
  missing: 'red',
  submitted: 'blue',
}

function LoppuselvitysPill({
  status,
  refused,
}: {
  status: SelvitysStatus | undefined
  refused: boolean | undefined
}) {
  if (!status || refused) {
    return <EmptyGreyPill />
  }
  const statusToFI = Loppuselvitys.statusToFI(status)
  return <Pill color={loppuselvitysStatusToColor[status]} text={statusToFI} />
}
