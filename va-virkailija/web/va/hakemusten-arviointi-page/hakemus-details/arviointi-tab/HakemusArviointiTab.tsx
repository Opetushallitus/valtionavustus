import '../../../style/admin.css'

import React, { useEffect } from 'react'
import Select from 'react-select'

import DateUtil from 'soresu-form/web/DateUtil'
import { ChangeLogEntry, Hakemus } from 'soresu-form/web/va/types'

import { useUserInfo } from '../../../initial-data-context'
import { HelpTooltip } from '../../../common-components/HelpTooltip'
import ProjectSelector from '../../../common-components/ProjectSelector'
import HakemusArviointiStatuses from '../../../HakemusArviointiStatuses'
import { VaCodeValue } from '../../../types'
import ApplicationPayments from '../common-components/ApplicationPayments'
import PresenterComment from '../common-components/PresenterComment'
import HakemusBudgetEditing from '../budgetedit/HakemusBudgetEditing'
import HakemusScoring from './HakemusScoring'
import HakemusComments from './HakemusComments'
import TraineeDayEditing from '../traineeday/TraineeDayEditing'
import SpecifyOppilaitos from './SpecifyOppilaitos'
import AcademySize from './AcademySize'
import Perustelut from './Perustelut'
import EditStatus from './EditStatus'
import ReSendDecisionEmail from './ReSendDecisionEmail'
import { ChangeRequest } from './ChangeRequest'
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from '../../arviointiStore'
import {
  addPayment,
  hasMultibatchPayments,
  removePayment,
  selectProject as selectProjectThunk,
  setArvioValue,
  startHakemusArvioAutoSave,
  updateHakemusStatus,
} from '../../arviointiReducer'
import { useHakemus } from '../../useHakemus'

export const HakemusArviointiTab = () => {
  const hakemus = useHakemus()
  const userInfo = useUserInfo()
  const avustushakuData = useHakemustenArviointiSelector((state) => state.arviointi.avustushakuData)
  const multibatchPaymentsEnabled = useHakemustenArviointiSelector(hasMultibatchPayments)
  const dispatch = useHakemustenArviointiDispatch()
  if (!avustushakuData) {
    return null
  }
  const { hakuData, projects } = avustushakuData
  const { avustushaku } = hakuData
  const {
    allowHakemusCommenting,
    allowHakemusStateChanges,
    allowHakemusScoring,
    allowHakemusOfficerEditing,
    allowHakemusCancellation,
  } = hakemus.accessControl ?? {}
  return (
    <div id="tab-content" className={hakemus.refused ? 'disabled' : ''}>
      <div id="arviointi-tab">
        <PresenterComment helpTextKey="hankkeen_sivu__arviointi___valmistelijan_huomiot" />
        <div className="koodien-valinta-elementti" data-test-id="code-value-dropdown__project">
          <h3 className="koodien-valinta-otsikko required">Projektikoodi</h3>
          <ProjectSelect
            hakemusId={hakemus.id}
            projects={projects}
            selectedProject={hakemus.project}
            disabled={!allowHakemusStateChanges}
          />
        </div>
        <TalousarviotiliSelect isDisabled={!allowHakemusStateChanges} hakemus={hakemus} />
        <SpecifyOppilaitos
          hakemus={hakemus}
          avustushaku={avustushaku}
          allowEditing={allowHakemusStateChanges}
        />
        <AcademySize
          hakemus={hakemus}
          avustushaku={avustushaku}
          allowEditing={allowHakemusStateChanges}
        />
        <HakemusScoring allowHakemusScoring={allowHakemusScoring} />
        <HakemusComments
          comments={hakemus.comments}
          allowHakemusCommenting={allowHakemusCommenting}
        />
        <SetArviointiStatus hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
        <Perustelut hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
        <ChangeRequest
          hakemus={hakemus}
          avustushaku={avustushaku}
          allowEditing={allowHakemusStateChanges}
          userInfo={userInfo}
        />
        <SummaryComment hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
        <HakemusBudgetEditing hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
        {multibatchPaymentsEnabled && (
          <ApplicationPayments
            application={hakemus}
            grant={avustushaku}
            index={0}
            payments={hakemus.payments}
            onAddPayment={(paymentSum: number, index: number) => {
              dispatch(
                addPayment({
                  paymentSum,
                  index,
                  hakemusId: hakemus.id,
                  projectCode: hakemus.project?.code,
                })
              )
            }}
            onRemovePayment={(paymentId: number) =>
              dispatch(removePayment({ paymentId, hakemusId: hakemus.id }))
            }
            readonly={true}
          />
        )}
        <TraineeDayEditing hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
        <EditStatus
          avustushaku={avustushaku}
          hakemus={hakemus}
          allowEditing={allowHakemusOfficerEditing}
          status="officer_edit"
        />
        {hakemus.status === 'draft' && userInfo.privileges.includes('va-admin') && (
          <div className="value-edit">
            <button
              onClick={() => {
                dispatch(
                  updateHakemusStatus({
                    hakemusId: hakemus.id,
                    status: 'submitted',
                    comment: 'Submitted by admin',
                  })
                )
              }}
              data-test-id="submit-hakemus"
            >
              Merkitse hakemus lähetetyksi
            </button>
          </div>
        )}
        <EditStatus
          avustushaku={avustushaku}
          hakemus={hakemus}
          allowEditing={allowHakemusCancellation}
          status="cancelled"
        />
        <ReSendDecisionEmail avustushaku={avustushaku} hakemus={hakemus} hakuData={hakuData} />
        <ChangeLog hakemus={hakemus} />
      </div>
    </div>
  )
}

class ChangeLog extends React.Component<{ hakemus: Hakemus }> {
  render() {
    const hakemus = this.props.hakemus
    const changelogs = hakemus.arvio.changelog
    if (!changelogs) {
      return null
    }
    return (
      <div className="changelog">
        <h2 className="changelog__heading">Muutoshistoria</h2>
        {changelogs.length ? (
          <table className="changelog__table">
            {changelogs.map((changelog, index) => (
              <ChangeLogRow key={index} changelog={changelog} hakemus={hakemus} />
            ))}
          </table>
        ) : (
          <div>Ei muutoksia</div>
        )}
      </div>
    )
  }
}

type ChangeLogRowProps = {
  hakemus: Hakemus
  changelog: ChangeLogEntry
}

type ChangeLogRowState = {
  currentHakemusId: number
  open: boolean
}

class ChangeLogRow extends React.Component<ChangeLogRowProps, ChangeLogRowState> {
  constructor(props: ChangeLogRowProps) {
    super(props)
    this.state = ChangeLogRow.initialState(props)
  }

  static getDerivedStateFromProps(props: ChangeLogRowProps, state: ChangeLogRowState) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return ChangeLogRow.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props: ChangeLogRowProps) {
    return {
      currentHakemusId: props.hakemus.id,
      open: false,
    }
  }

  render() {
    const changelog = this.props.changelog
    const types = {
      'budget-change': 'Budjetti päivitetty',
      'oppilaitokset-change': 'Oppilaitokset päivitetty',
      'summary-comment': 'Perustelut hakijalle',
      'overridden-answers-change': 'Sisältöä päivitetty',
      'presenter-comment': 'Valmistelijan huomiot päivitetty',
      'status-change': 'Tila päivitetty',
      'should-pay-change': 'Maksuun kyllä/ei päivitetty',
    }
    const typeTranslated = types[changelog.type] || changelog.type
    const dateStr =
      DateUtil.asDateString(changelog.timestamp) + ' ' + DateUtil.asTimeString(changelog.timestamp)

    const toggleOpen = () => {
      this.setState({ open: !this.state.open })
    }

    return (
      <tbody>
        <tr className="changelog__row">
          <td className="changelog__date">{dateStr}</td>
          <td className="changelog__name">
            {changelog['first-name']} {changelog['last-name']}
          </td>
          <td className="changelog__type">
            <a onClick={toggleOpen}>{typeTranslated}</a>
          </td>
        </tr>
        <tr>
          {this.state.open && (
            <td colSpan={3}>
              <pre className="changelog__data">{JSON.stringify(changelog.data)}</pre>
            </td>
          )}
        </tr>
      </tbody>
    )
  }
}

type SetArviointiStatusProps = {
  hakemus: Hakemus
  allowEditing?: boolean
}

const SetArviointiStatus = ({ hakemus, allowEditing }: SetArviointiStatusProps) => {
  const arvio = hakemus.arvio
  const status = arvio ? arvio.status : undefined
  const statuses = []
  const statusValues = HakemusArviointiStatuses.statuses
  const dispatch = useHakemustenArviointiDispatch()
  for (let i = 0; i < statusValues.length; i++) {
    const htmlId = 'set-arvio-status-' + statusValues[i]
    const statusFI = HakemusArviointiStatuses.statusToFI(statusValues[i])
    const onChange = allowEditing
      ? () => {
        dispatch(
          setArvioValue({
            hakemusId: hakemus.id,
            key: 'status',
            value: statusValues[i],
          })
        )
        dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
      }
      : undefined
    statuses.push(
      <input
        id={htmlId}
        type="radio"
        key={htmlId}
        name="status"
        value={statusValues[i]}
        disabled={!allowEditing}
        onChange={onChange}
        checked={statusValues[i] === status}
      />
    )
    statuses.push(
      <label key={htmlId + '-label'} htmlFor={htmlId}>
        {statusFI}
      </label>
    )
  }

  return (
    <div className="hakemus-arviointi-section">
      <label>Hakemuksen tila:</label>
      <HelpTooltip
        testId={'tooltip-tila'}
        textKey="hankkeen_sivu__arviointi___hakemuksen_tila"
        direction={'arviointi'}
      />
      <fieldset className="soresu-radiobutton-group">{statuses}</fieldset>
    </div>
  )
}

type SummaryCommentProps = {
  hakemus: Hakemus
  allowEditing?: boolean
}

const SummaryComment = ({ allowEditing, hakemus }: SummaryCommentProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: 'summary-comment',
        value: event.target.value,
      })
    )
    dispatch(
      startHakemusArvioAutoSave({
        hakemusId: hakemus.id,
      })
    )
  }
  const summaryComment = hakemus.arvio['summary-comment'] ?? ''

  return (
    <div className="value-edit summary-comment">
      <label htmlFor="summary-comment">Huomautus päätöslistaan</label>
      <HelpTooltip
        testId={'tooltip-huomautus'}
        textKey="hankkeen_sivu__arviointi___huomautus_päätöslistaan"
        direction="arviointi-slim"
      />
      <textarea
        id="summary-comment"
        rows={1}
        disabled={!allowEditing}
        value={summaryComment}
        onChange={onChange}
        maxLength={128}
      />
    </div>
  )
}

interface ProjectSelectProps {
  hakemusId: number
  disabled: boolean
  projects: VaCodeValue[]
  selectedProject?: VaCodeValue
}

const ProjectSelect = ({ hakemusId, projects, selectedProject, disabled }: ProjectSelectProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  useEffect(() => {
    const couldPreselectOnlyAvailableProjectCode =
      !disabled &&
      projects.length === 1 &&
      projects[0]['code-value'] !== 'Ei projektikoodia' &&
      !selectedProject
    if (couldPreselectOnlyAvailableProjectCode) {
      dispatch(selectProjectThunk({ project: projects[0], hakemusId }))
    }
  }, [disabled, projects, selectedProject])
  const selectProject = (option: VaCodeValue | null) => {
    if (option === null) {
      return
    }
    dispatch(selectProjectThunk({ project: option, hakemusId }))
  }
  return (
    <ProjectSelector
      updateValue={selectProject}
      codeOptions={projects}
      selectedValue={selectedProject}
      disabled={disabled}
    />
  )
}

interface TalousarviotiliSelectProps {
  isDisabled: boolean
  hakemus: Hakemus
}

const TalousarviotiliSelect = ({ isDisabled, hakemus }: TalousarviotiliSelectProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const { rahoitusalue, talousarviotili } = hakemus.arvio
  const hakemusId = hakemus.id
  const tilit = hakemus.talousarviotilit ?? []
  const options = tilit.flatMap((tili) => {
    if (tili.koulutusasteet.length === 0) {
      return []
    }
    return tili.koulutusasteet.map((aste) => ({
      value: {
        talousarviotili: tili.code,
        rahoitusalue: aste,
      },
      label: `${aste} ${tili.code} ${tili.name ?? ''}`,
    }))
  })
  const value = options.find(
    ({ value }) => value.rahoitusalue === rahoitusalue && value.talousarviotili === talousarviotili
  )
  useEffect(() => {
    const couldSelectTheOneExistingTili = !isDisabled && options.length === 1
    if (couldSelectTheOneExistingTili && !rahoitusalue) {
      dispatch(
        setArvioValue({
          hakemusId,
          key: 'rahoitusalue',
          value: options[0].value.rahoitusalue,
        })
      )
      dispatch(startHakemusArvioAutoSave({ hakemusId }))
    }
    if (couldSelectTheOneExistingTili && !talousarviotili) {
      dispatch(
        setArvioValue({
          hakemusId,
          key: 'talousarviotili',
          value: options[0].value.talousarviotili,
        })
      )
      dispatch(startHakemusArvioAutoSave({ hakemusId }))
    }
  }, [isDisabled, rahoitusalue, talousarviotili, options, hakemusId])
  return (
    <div>
      <h3>
        TA-tili{' '}
        <HelpTooltip
          testId={'tooltip-talousarviotili'}
          textKey="hankkeen_sivu__arviointi___talousarviotili"
          direction="left"
        />
        &nbsp;*
      </h3>
      <Select
        value={value}
        options={options}
        classNamePrefix="tatiliSelection"
        isOptionDisabled={(option) => option.label === value?.label}
        onChange={(option) => {
          if (!option) {
            return
          }
          dispatch(
            setArvioValue({
              hakemusId: hakemus.id,
              key: 'rahoitusalue',
              value: option.value.rahoitusalue,
            })
          )
          dispatch(
            setArvioValue({
              hakemusId: hakemus.id,
              key: 'talousarviotili',
              value: option.value.talousarviotili,
            })
          )
          dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
        }}
        isDisabled={isDisabled}
        placeholder="Valitse talousarviotili"
      />
    </div>
  )
}
