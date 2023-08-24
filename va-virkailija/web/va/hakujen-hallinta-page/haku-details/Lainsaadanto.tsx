import React, { ChangeEvent, useEffect, useState } from 'react'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { HelpTexts } from 'soresu-form/web/va/types'

import HelpTooltip from '../../common-components/HelpTooltip'
import { useHakujenHallintaDispatch } from '../hakujenHallintaStore'
import {
  completeManualSave,
  LainsaadantoOption,
  Avustushaku,
  startManuallySaving,
} from '../hakuReducer'

type LainsaadantoProps = {
  avustushaku: Avustushaku
  lainsaadantoOptions: LainsaadantoOption[]
  helpTexts: HelpTexts
}

export const Lainsaadanto = ({
  avustushaku,
  helpTexts,
  lainsaadantoOptions,
}: LainsaadantoProps) => {
  const [lainsaadanto, setLainsaadanto] = useState<number[]>([])
  const dispatch = useHakujenHallintaDispatch()
  useEffect(() => {
    const fetchLainsaadanto = async () => {
      const resp = await HttpUtil.get<number[]>(`/api/avustushaku/${avustushaku.id}/lainsaadanto`)
      setLainsaadanto(resp)
    }

    void fetchLainsaadanto()
  }, [avustushaku.id])

  const onChange = (id: number) => async (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(startManuallySaving())
    const newLainsaadanto = e.target.checked
      ? [...new Set([...lainsaadanto, id])]
      : lainsaadanto.filter((i) => i !== id)
    await HttpUtil.post(`/api/avustushaku/${avustushaku.id}/lainsaadanto`, newLainsaadanto)
    setLainsaadanto(newLainsaadanto)
    dispatch(completeManualSave())
  }

  return (
    <div className="lainsaadanto">
      <h3>
        Lainsäädäntö
        <HelpTooltip
          content={helpTexts['hakujen_hallinta__haun_tiedot___lainsaadanto']}
          direction="left"
        />
      </h3>
      <div className="lainsaadanto_options">
        {lainsaadantoOptions.map((option) => {
          const id = `lainsaadanto-${option.id}`
          return (
            <div key={id} className="lainsaadanto_option">
              <input
                type="checkbox"
                id={id}
                onChange={onChange(option.id)}
                checked={lainsaadanto.includes(option.id)}
              />
              <label htmlFor={id}>{option.name}</label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
