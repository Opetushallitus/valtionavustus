import React, {useState} from "react";
import {
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

interface Props {
  selectedHakemus: Hakemus | undefined | {}
  hakemusList: Hakemus[]
  avustushaku: Avustushaku
  roles: Role[]
  splitView: boolean
  onSelectHakemus: (hakemusId: number) => void
  onYhteenvetoClick: (filteredHakemusList: Hakemus[]) => void
}

export default function NewHakemusListing(props: Props) {
  const {avustushaku, selectedHakemus, hakemusList, onSelectHakemus, onYhteenvetoClick, roles, splitView} = props
  const selectedHakemusId = selectedHakemus && 'id' in selectedHakemus ? selectedHakemus.id : undefined
  const [organizationFilter, setOrganizationFilter] = useState('')
  const [projectNameFilter, setProjectNameFilter] = useState('')
  const filteredHakemusList = hakemusList
    .filter(hakemus => hakemus["organization-name"].toLocaleLowerCase().includes(organizationFilter))
    .filter(hakemus => hakemus["project-name"].toLocaleLowerCase().includes(projectNameFilter))
  const isResolved = avustushaku.status === 'resolved'
  return (
    <div className={selectedHakemus && splitView ? styles.splitView : undefined}>
      {
        isResolved ? (
          <ResolvedTable
            filteredList={filteredHakemusList}
            selectedHakemusId={selectedHakemusId}
            totalHakemusListLength={hakemusList.length}
            onYhteenvetoClick={onYhteenvetoClick}
            onSelectHakemus={onSelectHakemus}
            onOrganizationInput={e => setOrganizationFilter(e.target.value)}
            onProjectInput={e => setProjectNameFilter(e.target.value)}
            organizationFilterValue={organizationFilter}
            projectFilterValue={projectNameFilter}
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
  filteredList: Hakemus[]
  selectedHakemusId: number | undefined
  totalHakemusListLength: number
  onOrganizationInput: (event: React.ChangeEvent<HTMLInputElement>) => void
  organizationFilterValue: string
  onProjectInput: (event: React.ChangeEvent<HTMLInputElement>) => void
  projectFilterValue: string
  onSelectHakemus: (hakemusId: number) => void
  onYhteenvetoClick: (filteredHakemusList: Hakemus[]) => void
  roles: Role[]
}

function ResolvedTable(props: ResolvedTableProps) {
  const {
    filteredList,
    selectedHakemusId,
    totalHakemusListLength,
    onOrganizationInput,
    onProjectInput,
    organizationFilterValue,
    projectFilterValue,
    onSelectHakemus,
    onYhteenvetoClick,
    roles,
  } = props
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
      <thead>
        <tr>
          <th className={styles.fixedColumn}>
            <input className={styles.filterInput} placeholder="Hakijaorganisaatio" onChange={onOrganizationInput} value={organizationFilterValue} />
          </th>
          <th className={styles.fixedColumn}>
            <input className={styles.filterInput} placeholder="Hanke tai asianumero" onChange={onProjectInput} value={projectFilterValue} />
          </th>
          <th>Tila</th>
          <th>Muutoshaku</th>
          <th>Väliselvitys</th>
          <th>Loppuselvitys</th>
          <th>Myönnetty</th>
          <th>Valmistelija</th>
          <th>Arvioija</th>
        </tr>
      </thead>
      <tbody>
      {filteredList.map(hakemus => (
        <tr key={`hakemus-${hakemus.id}`}
            className={hakemus.id === selectedHakemusId ? styles.selectedHakemusRow : styles.hakemusRow}
            tabIndex={0}
            onClick={() => onSelectHakemus(hakemus.id)}>
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
          {filteredList.length}/{totalHakemusListLength} hakemusta
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
