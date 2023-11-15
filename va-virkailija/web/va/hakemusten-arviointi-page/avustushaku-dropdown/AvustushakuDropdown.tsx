import React from 'react'

import DropdownList from 'react-widgets/DropdownList'

import styles from './avustushaku-dropdown.module.less'
import { useNavigate } from 'react-router-dom'
import { useHakemustenArviointiDispatch, useHakemustenArviointiSelector } from '../arviointiStore'
import { DropdownAvustushaku, fetchAvustushakuInfo, getLoadedState } from '../arviointiReducer'

export default function AvustushakuDropdown() {
  const navigate = useNavigate()
  const dispatch = useHakemustenArviointiDispatch()
  const avustushaut = useHakemustenArviointiSelector(
    (state) => getLoadedState(state.arviointi).avustushaut
  )
  const { id: defaultHakuId } = useHakemustenArviointiSelector(
    (state) => getLoadedState(state.arviointi).hakuData.avustushaku
  )
  // at this time react-widget typings has textField fn parameter as unknown :(
  const avustushakuToText = (avustushaku: any) => {
    return avustushaku.name
  }
  const onChange = (value: DropdownAvustushaku) => {
    navigate(`/avustushaku/${value.id}`)
    dispatch(fetchAvustushakuInfo(value.id))
  }
  const messages = {
    filterPlaceholder: '',
    emptyList: 'Ei avustushakuja',
    emptyFilter: 'Ei tuloksia',
  }
  return (
    <div id="avustushaku-dropdown">
      <DropdownList
        dataKey="id"
        containerClassName={styles.dropdownList}
        textField={avustushakuToText}
        data={avustushaut}
        defaultValue={avustushaut.find(({ id }) => id === defaultHakuId)}
        renderValue={AvustushakuEntry}
        filter="contains"
        onChange={onChange}
        messages={messages}
      />
    </div>
  )
}

function AvustushakuEntry({ item }: { item: DropdownAvustushaku; dataKey: unknown; text: string }) {
  return <span>{item.name}</span>
}
