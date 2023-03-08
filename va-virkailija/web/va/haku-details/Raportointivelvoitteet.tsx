import { debounce } from 'lodash'
import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import Select, { components, OptionProps, GroupBase } from 'react-select'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { HelpTexts, Raportointivelvoite } from 'soresu-form/web/va/types'

import HelpTooltip from '../HelpTooltip'
import { DateInput } from './DateInput'
import { useHakujenHallintaDispatch } from '../hakujenHallinta/hakujenHallintaStore'
import {
  completeManualSave,
  Avustushaku,
  startManuallySaving,
} from '../hakujenHallinta/hakuReducer'

type RaportointivelvoitteetProps = {
  avustushaku: Avustushaku
  helpTexts: HelpTexts
}

type RaportointivelvoiteProps = {
  index: number
  raportointivelvoite?: Raportointivelvoite
  helpTexts: HelpTexts
  postRaportointivelvoite: (r: Raportointivelvoite) => void | undefined
  putRaportointivelvoite: (index: number, r: Raportointivelvoite) => void | undefined
  addRaportointivelvoite: (index: number) => void
  deleteRaportointivelvoite: (index: number, r?: Raportointivelvoite) => Promise<void> | undefined
}

const AddButton = () => (
  <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 0.5C4.45312 0.5 0 4.99219 0 10.5C0 16.0469 4.45312 20.5 10 20.5C15.5078 20.5 20 16.0469 20 10.5C20 4.99219 15.5078 0.5 10 0.5ZM13.75 11.4375H10.9375V14.25C10.9375 14.7969 10.5078 15.1875 10 15.1875C9.45312 15.1875 9.0625 14.7969 9.0625 14.25V11.4375H6.25C5.70312 11.4375 5.3125 11.0469 5.3125 10.5C5.3125 9.99219 5.70312 9.5625 6.25 9.5625H9.0625V6.75C9.0625 6.24219 9.45312 5.8125 10 5.8125C10.5078 5.8125 10.9375 6.24219 10.9375 6.75V9.5625H13.75C14.2578 9.5625 14.6875 9.99219 14.6875 10.5C14.6875 11.0469 14.2578 11.4375 13.75 11.4375Z"
      fill="#499CC7"
    />
  </svg>
)

const RemoveButton = () => (
  <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 0.5C4.45312 0.5 0 4.99219 0 10.5C0 16.0469 4.45312 20.5 10 20.5C15.5078 20.5 20 16.0469 20 10.5C20 4.99219 15.5078 0.5 10 0.5ZM13.75 11.4375H6.25C5.70312 11.4375 5.3125 11.0469 5.3125 10.5C5.3125 9.99219 5.70312 9.5625 6.25 9.5625H13.75C14.2578 9.5625 14.6875 9.99219 14.6875 10.5C14.6875 11.0469 14.2578 11.4375 13.75 11.4375Z"
      fill="#BA3E35"
    />
  </svg>
)

type OptionType = { value: string; label: string }

const options = [
  { value: 'Avustuspäätökset', label: 'Avustuspäätökset' },
  { value: 'Väliraportti', label: 'Väliraportti' },
  { value: 'Loppuraportti', label: 'Loppuraportti' },
  { value: 'Muu raportti', label: 'Muu raportti' },
]

export function Option({
  children,
  ...props
}: PropsWithChildren<OptionProps<OptionType, false, GroupBase<OptionType>>>) {
  const { data, innerProps } = props
  const propsWithDataTestId = { ...innerProps, 'data-test-id': data.value }
  return (
    <components.Option {...props} innerProps={propsWithDataTestId}>
      {children}
    </components.Option>
  )
}

const Raportointivelvoite = ({
  index,
  raportointivelvoite,
  helpTexts,
  postRaportointivelvoite,
  putRaportointivelvoite,
  addRaportointivelvoite,
  deleteRaportointivelvoite,
}: RaportointivelvoiteProps) => {
  const [raportointilaji, setRaportointilaji] = useState(raportointivelvoite?.raportointilaji)
  const [maaraaika, setMaaraaika] = useState(raportointivelvoite?.maaraaika)
  const [ashaTunnus, setAshaTunnus] = useState(raportointivelvoite?.['asha-tunnus'])
  const [lisatiedot, setLisatiedot] = useState(raportointivelvoite?.lisatiedot)

  useEffect(() => {
    if (
      raportointilaji &&
      maaraaika &&
      ashaTunnus &&
      (raportointivelvoite?.raportointilaji !== raportointilaji ||
        raportointivelvoite?.maaraaika !== maaraaika ||
        raportointivelvoite?.['asha-tunnus'] !== ashaTunnus ||
        raportointivelvoite?.lisatiedot !== lisatiedot)
    ) {
      if (raportointivelvoite?.id) {
        postRaportointivelvoite({
          id: raportointivelvoite?.id,
          raportointilaji,
          maaraaika,
          'asha-tunnus': ashaTunnus,
          lisatiedot,
        })
      } else {
        putRaportointivelvoite(index, {
          raportointilaji,
          maaraaika,
          'asha-tunnus': ashaTunnus,
          lisatiedot,
        })
      }
    }
  }, [raportointilaji, maaraaika, ashaTunnus, lisatiedot])

  return (
    <div className="raportointivelvoitteet_row">
      <div className="raportointivelvoitteet_raportointilaji">
        <h3 className="raportointivelvoitteet_label">Raportointilaji</h3>
        <Select
          id={`raportointilaji-dropdown-${index}`}
          placeholder="Valitse raportointilaji"
          options={options}
          onChange={(newValue) => setRaportointilaji(newValue?.value)}
          defaultValue={
            raportointilaji ? { value: raportointilaji, label: raportointilaji } : undefined
          }
          components={{ Option }}
        />
      </div>
      <div className="raportointivelvoitteet_maaraaika">
        <h3 className="raportointivelvoitteet_label">
          Raportin määräaika
          <HelpTooltip
            content={helpTexts['hakujen_hallinta__haun_tiedot___raportin_määräaika']}
            direction="left"
          />
        </h3>
        <DateInput
          id={`maaraaika-${index}`}
          onChange={(_id, date) => setMaaraaika(date.format('YYYY-MM-DD'))}
          defaultValue={maaraaika ? new Date(maaraaika) : undefined}
          allowEmpty={true}
          placeholder="Päivämäärä"
          disabled={!raportointilaji}
        />
      </div>
      <div className="raportointivelvoitteet_asha-tunnus">
        <h3 className="raportointivelvoitteet_label">
          Asha-tunnus
          <HelpTooltip content={helpTexts['hakujen_hallinta__haun_tiedot___asha-tunnus']} />
        </h3>
        <input
          id={`asha-tunnus-${index}`}
          value={ashaTunnus}
          onChange={(e) => setAshaTunnus(e.target.value)}
          disabled={!raportointilaji}
        />
      </div>
      <div className="raportointivelvoitteet_lisatiedot">
        <h3 className="raportointivelvoitteet_label">
          Lisätiedot
          <HelpTooltip
            content={helpTexts['hakujen_hallinta__haun_tiedot___raportointi_lisätiedot']}
          />
        </h3>
        <input
          id={`lisatiedot-${index}`}
          value={lisatiedot}
          onChange={(e) => setLisatiedot(e.target.value)}
          disabled={!raportointilaji}
        />
      </div>
      <div className="raportointivelvoitteet_buttons">
        <button
          id={`new-raportointivelvoite-${index}`}
          className="raportointivelvoitteet_button"
          onClick={() => addRaportointivelvoite(index)}
        >
          <AddButton />
        </button>
        <button
          className="raportointivelvoitteet_button"
          onClick={() =>
            raportointivelvoite && deleteRaportointivelvoite(index, raportointivelvoite)
          }
        >
          <RemoveButton />
        </button>
      </div>
    </div>
  )
}

export const Raportointivelvoitteet = ({ avustushaku, helpTexts }: RaportointivelvoitteetProps) => {
  const [raportointivelvoitteet, setRaportointivelvoitteet] = useState<
    Raportointivelvoite[] | undefined
  >()
  const dispatch = useHakujenHallintaDispatch()
  const startAutoSave = () => dispatch(startManuallySaving())
  useEffect(() => {
    const fetchRaportointivelvoitteet = async () => {
      const r = await HttpUtil.get<Raportointivelvoite[]>(
        `/api/avustushaku/${avustushaku.id}/raportointivelvoitteet`
      )
      setRaportointivelvoitteet(
        r.length
          ? r
          : [
              {
                'asha-tunnus': '',
                lisatiedot: '',
              } as Raportointivelvoite,
            ]
      )
    }

    void fetchRaportointivelvoitteet()
  }, [avustushaku.id])

  const putRaportointivelvoite = useCallback(
    debounce(async (index: number, r: Raportointivelvoite) => {
      const newRaportointivelvoite = await HttpUtil.put(
        `/api/avustushaku/${avustushaku.id}/raportointivelvoite`,
        r
      )
      setRaportointivelvoitteet(
        raportointivelvoitteet?.map((old, i) => (i === index ? newRaportointivelvoite : old))
      )
      dispatch(completeManualSave())
    }, 2000),
    [raportointivelvoitteet]
  )

  const postRaportointivelvoite = useCallback(
    debounce(async (r: Raportointivelvoite) => {
      await HttpUtil.post(`/api/avustushaku/${avustushaku.id}/raportointivelvoite/${r.id}`, r)
      setRaportointivelvoitteet(raportointivelvoitteet?.map((old) => (old.id === r.id ? r : old)))
      dispatch(completeManualSave())
    }, 2000),
    [raportointivelvoitteet]
  )

  const addRaportointivelvoite = (index: number) => {
    const newRaportointivelvoitteet = [...(raportointivelvoitteet ?? [])]
    newRaportointivelvoitteet.splice(index + 1, 0, {
      'asha-tunnus': '',
      lisatiedot: '',
    } as Raportointivelvoite)
    setRaportointivelvoitteet(newRaportointivelvoitteet)
  }

  const deleteRaportointivelvoite = async (index: number, r?: Raportointivelvoite) => {
    if (r?.id) {
      dispatch(startManuallySaving())
      await HttpUtil.delete(`/api/avustushaku/${avustushaku.id}/raportointivelvoite/${r.id}`)
      setRaportointivelvoitteet(raportointivelvoitteet?.filter((old) => old.id !== r.id))
      dispatch(completeManualSave())
    } else {
      const newRaportointivelvoitteet = [...(raportointivelvoitteet ?? [])]
      newRaportointivelvoitteet.splice(index, 1)
      setRaportointivelvoitteet(newRaportointivelvoitteet)
    }
  }

  return (
    <div className="raportointivelvoitteet">
      <h1>OPH:lle asetetut raportointivelvoitteet</h1>
      <br />
      <span>
        OPH:lta mahdollisesti edellytettävät raportointivelvoitteet kuvataan tässä osiossa.
        Raportointivelvoitteet löydät määrärahan asettamiskirjeestä ja muista valtionavustusta
        ohjaavista asiakirjoista.
      </span>
      {raportointivelvoitteet?.map((r, i) => (
        <Raportointivelvoite
          key={`raportointivelvoite-${i}-${r.id}`}
          index={i}
          raportointivelvoite={r}
          helpTexts={helpTexts}
          putRaportointivelvoite={(index, raportointivelvoite) => {
            startAutoSave()
            putRaportointivelvoite(index, raportointivelvoite)
          }}
          postRaportointivelvoite={(raportointivelvoite) => {
            startAutoSave()
            postRaportointivelvoite(raportointivelvoite)
          }}
          addRaportointivelvoite={addRaportointivelvoite}
          deleteRaportointivelvoite={deleteRaportointivelvoite}
        />
      ))}
    </div>
  )
}
