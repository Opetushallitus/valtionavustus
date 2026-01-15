import React from 'react'

import DropdownList from 'react-widgets/DropdownList'

import * as styles from './avustushaku-dropdown.module.css'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useHakemustenArviointiDispatch, useHakemustenArviointiSelector } from '../arviointiStore'
import { DropdownAvustushaku, fetchAvustushakuInfo } from '../arviointiReducer'

export default function AvustushakuDropdown() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dispatch = useHakemustenArviointiDispatch()
  const avustushaut = useHakemustenArviointiSelector((state) => state.arviointi.avustushaut)
  const { avustushakuId: avustushakuIdFromParams } = useParams()
  const avustushakuId = Number(avustushakuIdFromParams)
  // at this time react-widget typings has textField fn parameter as unknown :(
  const avustushakuToText = (avustushaku: any) => {
    return avustushaku.name
  }
  const onChange = (value: DropdownAvustushaku) => {
    navigate(`/avustushaku/${value.id}?${searchParams.toString()}`)
    dispatch(fetchAvustushakuInfo(value.id))
  }
  const messages = {
    filterPlaceholder: '',
    emptyList: 'Ei avustushakuja',
    emptyFilter: 'Ei tuloksia',
  }
  const value = avustushaut?.find(({ id }) => id === avustushakuId)
  const loadingAvustushaut = avustushaut === undefined

  return (
    <div id="avustushaku-dropdown">
      <DropdownList
        dataKey="id"
        data-test-id="avustushaku-dropdown"
        busy={loadingAvustushaut}
        disabled={loadingAvustushaut}
        containerClassName={styles.dropdownList}
        textField={avustushakuToText}
        placeholder="Valitse avustushaku listasta"
        data={avustushaut}
        renderValue={AvustushakuEntry}
        filter="contains"
        value={value}
        onChange={onChange}
        messages={messages}
      />
    </div>
  )
}

function AvustushakuEntry({ item }: { item: DropdownAvustushaku; dataKey: unknown; text: string }) {
  return <span>{item.name}</span>
}
