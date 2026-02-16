import type { SetStateAction, Dispatch } from 'react'
import { debounce } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import Select, { components, OptionProps, GroupBase } from 'react-select'

import { HelpTexts, Raportointivelvoite } from 'soresu-form/web/va/types'

const DEFAULT_AUTOSAVE_TIMEOUT = 3000
const getAutosaveTimeout = () => window.__VA_AUTOSAVE_TIMEOUT__ ?? DEFAULT_AUTOSAVE_TIMEOUT

import HelpTooltip from '../../common-components/HelpTooltip'
import { DateInput } from './DateInput'
import { useHakujenHallintaDispatch } from '../hakujenHallintaStore'
import { VirkailijaAvustushaku, completeManualSave, startManuallySaving } from '../hakuReducer'
import {
  useDeleteRaportointivelvoiteMutation,
  useGetRaportointiveloitteetQuery,
  usePostRaportointivelvoiteMutation,
  usePutRaportointivelvoiteMutation,
} from '../../apiSlice'
import { useCurrentAvustushaku } from '../useAvustushaku'

type RaportointivelvoitteetProps = {
  avustushaku: VirkailijaAvustushaku
  helpTexts: HelpTexts
}

type RaportointivelvoiteProps = {
  index: number
  last: boolean
  raportointivelvoite?: Raportointivelvoite
  helpTexts: HelpTexts
  avustushakuId: number
  getAllSelectedRaportointilaji: ExistingRaportointiSelection[]
  setAllSelectedRaportointilaji: Dispatch<SetStateAction<ExistingRaportointiSelection[]>>
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
}: React.PropsWithChildren<OptionProps<OptionType, false, GroupBase<OptionType>>>) {
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
  last,
  raportointivelvoite,
  helpTexts,
  avustushakuId,
  getAllSelectedRaportointilaji,
  setAllSelectedRaportointilaji,
}: RaportointivelvoiteProps) => {
  const [raportointilaji, setRaportointilaji] = useState(raportointivelvoite?.raportointilaji)
  const [maaraaika, setMaaraaika] = useState(raportointivelvoite?.maaraaika)
  const [ashaTunnus, setAshaTunnus] = useState(raportointivelvoite?.['asha-tunnus'])
  const [lisatiedot, setLisatiedot] = useState(raportointivelvoite?.lisatiedot)
  const [putRaportointivelvoite] = usePutRaportointivelvoiteMutation()
  const [postRaportointivelvoite] = usePostRaportointivelvoiteMutation()
  const [deleteRaportointivelvoite] = useDeleteRaportointivelvoiteMutation()
  const dispatch = useHakujenHallintaDispatch()
  const avustushaku = useCurrentAvustushaku()
  const status = avustushaku?.status
  const editable = status === 'new' || status === 'draft'
  const startAutoSave = () => dispatch(startManuallySaving())
  const saveSuccessful =
    (success = true) =>
    () =>
      dispatch(completeManualSave(success))
  const debouncedPutRaportointivelvoite = useCallback(
    debounce(
      async (payload: { raportointivelvoite: Raportointivelvoite; avustushakuId: number }) => {
        putRaportointivelvoite(payload).unwrap().then(saveSuccessful()).catch(saveSuccessful(false))
      },
      getAutosaveTimeout()
    ),
    []
  )
  const debouncedPostRaportointivelvoite = useCallback(
    debounce(
      async (payload: { raportointivelvoite: Raportointivelvoite; avustushakuId: number }) => {
        postRaportointivelvoite(payload)
          .unwrap()
          .then(saveSuccessful())
          .catch(saveSuccessful(false))
      },
      getAutosaveTimeout()
    ),
    []
  )
  const saveRaportointivelvoiteImmediately = useCallback(
    debounce((body: Raportointivelvoite) => {
      debouncedPutRaportointivelvoite.cancel()
      debouncedPostRaportointivelvoite.cancel()
      startAutoSave()
      const payload = { raportointivelvoite: body, avustushakuId }
      if (body.id) {
        postRaportointivelvoite(payload)
          .unwrap()
          .then(saveSuccessful())
          .catch(saveSuccessful(false))
      } else {
        putRaportointivelvoite(payload).unwrap().then(saveSuccessful()).catch(saveSuccessful(false))
      }
    }, 100),
    [avustushakuId]
  )
  useEffect(() => {
    if (
      raportointilaji &&
      maaraaika &&
      ashaTunnus &&
      (raportointivelvoite?.['asha-tunnus'] !== ashaTunnus ||
        raportointivelvoite?.lisatiedot !== lisatiedot)
    ) {
      startAutoSave()
      const body = {
        id: raportointivelvoite?.id,
        raportointilaji,
        maaraaika,
        'asha-tunnus': ashaTunnus,
        lisatiedot,
      }
      if (body?.id) {
        debouncedPostRaportointivelvoite({
          raportointivelvoite: body,
          avustushakuId,
        })
      } else {
        debouncedPutRaportointivelvoite({
          raportointivelvoite: body,
          avustushakuId,
        })
      }
    }
  }, [ashaTunnus, lisatiedot])

  function onChangeRaportointilaji(selectedLaji: string | undefined) {
    setRaportointilaji(selectedLaji)

    if (selectedLaji) {
      setAllSelectedRaportointilaji((allSelections) => {
        const existingSelectionsWithoutThisComponent = allSelections.filter(
          (selection) => selection.id !== raportointivelvoite?.id
        )
        return [
          ...existingSelectionsWithoutThisComponent,
          { id: raportointivelvoite?.id, raportointilaji: selectedLaji },
        ]
      })
      // Save immediately if all required fields are present
      if (maaraaika && ashaTunnus) {
        saveRaportointivelvoiteImmediately({
          id: raportointivelvoite?.id,
          raportointilaji: selectedLaji,
          maaraaika,
          'asha-tunnus': ashaTunnus,
          lisatiedot,
        })
      }
    }
  }

  const onChangeMaaraaika = (_id: string, date: any) => {
    const formattedDate = date.format('YYYY-MM-DD')
    setMaaraaika(formattedDate)
    if (raportointilaji && ashaTunnus) {
      saveRaportointivelvoiteImmediately({
        id: raportointivelvoite?.id,
        raportointilaji,
        maaraaika: formattedDate,
        'asha-tunnus': ashaTunnus,
        lisatiedot,
      })
    }
  }

  function isRaportointilajiPreviouslySelected(laji: string) {
    return getAllSelectedRaportointilaji.some((selection) => selection.raportointilaji === laji)
  }

  const possiblyDisabledOptions = options.map((option) => ({
    ...option,
    isDisabled: isRaportointilajiPreviouslySelected(option.value),
  }))

  const currentSelection = options.find((o) => o.value === raportointilaji)

  return (
    <div className="raportointivelvoitteet_row">
      <div className="raportointivelvoitteet_raportointilaji">
        <h3 className="raportointivelvoitteet_label">Raportointilaji</h3>
        <Select
          data-test-id={`raportointilaji-dropdown-${index}`}
          id={`raportointilaji-dropdown-${index}`}
          placeholder="Valitse raportointilaji"
          options={possiblyDisabledOptions}
          onChange={(newValue) => onChangeRaportointilaji(newValue?.value)}
          value={currentSelection}
          components={{ Option }}
          isDisabled={!editable}
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
          data-test-id={`maaraaika-${index}`}
          id={`maaraaika-${index}`}
          onChange={onChangeMaaraaika}
          defaultValue={maaraaika ? new Date(maaraaika) : undefined}
          allowEmpty={true}
          placeholder="Päivämäärä"
          disabled={!editable || !raportointilaji}
        />
      </div>
      <div className="raportointivelvoitteet_asha-tunnus">
        <h3 className="raportointivelvoitteet_label">
          Asha-tunnus
          <HelpTooltip content={helpTexts['hakujen_hallinta__haun_tiedot___asha-tunnus']} />
        </h3>
        <input
          data-test-id={`asha-tunnus-${index}`}
          id={`asha-tunnus-${index}`}
          value={ashaTunnus}
          onChange={(e) => setAshaTunnus(e.target.value)}
          disabled={!editable || !raportointilaji}
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
          data-test-id={`lisatiedot-${index}`}
          id={`lisatiedot-${index}`}
          value={lisatiedot}
          onChange={(e) => setLisatiedot(e.target.value)}
          disabled={!editable || !raportointilaji}
        />
      </div>
      <div className="raportointivelvoitteet_buttons">
        {last ? (
          <button id={`new-raportointivelvoite-${index}`} className="raportointivelvoitteet_button">
            <AddButton />
          </button>
        ) : (
          <button
            className="raportointivelvoitteet_button"
            data-test-id={`remove-button-${index}`}
            onClick={() => {
              if (raportointivelvoite?.id) {
                startAutoSave()
                deleteRaportointivelvoite({
                  raportointivelvoiteId: raportointivelvoite.id,
                  avustushakuId,
                })
                  .unwrap()
                  .then(saveSuccessful())
                  .catch(saveSuccessful(false))
              }
            }}
          >
            <RemoveButton />
          </button>
        )}
      </div>
    </div>
  )
}

interface ExistingRaportointiSelection {
  id: number | undefined
  raportointilaji: string
}

interface PlaceholderRaportointivelvoite extends Raportointivelvoite {
  placeholderId?: number
}

export const Raportointivelvoitteet = ({ avustushaku, helpTexts }: RaportointivelvoitteetProps) => {
  const { data } = useGetRaportointiveloitteetQuery(avustushaku.id)
  const [raportointiveloitteet, setRaportointiveloitteet] = useState<
    PlaceholderRaportointivelvoite[] | undefined
  >(data)
  const [getAllSelectedRaportointilaji, setAllSelectedRaportointilaji] = useState<
    ExistingRaportointiSelection[]
  >([])

  useEffect(() => {
    const velvoitteet = (data ?? []).concat([
      {
        'asha-tunnus': '',
        lisatiedot: '',
        placeholderId: Math.random(),
      } as PlaceholderRaportointivelvoite,
    ])

    setRaportointiveloitteet(velvoitteet)
    setAllSelectedRaportointilaji(
      velvoitteet.map((v) => ({ id: v.id, raportointilaji: v.raportointilaji }))
    )
  }, [data])

  return (
    <div className="raportointivelvoitteet">
      <h1>OPH:lle asetetut raportointivelvoitteet</h1>
      <br />
      <span>
        OPH:lta mahdollisesti edellytettävät raportointivelvoitteet kuvataan tässä osiossa.
        Raportointivelvoitteet löydät määrärahan asettamiskirjeestä ja muista valtionavustusta
        ohjaavista asiakirjoista.
      </span>
      {raportointiveloitteet?.map((r, i) => (
        <Raportointivelvoite
          key={`raportointivelvoite-${i}-${r.id}-${r.placeholderId}`}
          index={i}
          last={raportointiveloitteet?.length === i + 1}
          raportointivelvoite={r}
          helpTexts={helpTexts}
          avustushakuId={avustushaku.id}
          setAllSelectedRaportointilaji={setAllSelectedRaportointilaji}
          getAllSelectedRaportointilaji={getAllSelectedRaportointilaji}
        />
      ))}
    </div>
  )
}
