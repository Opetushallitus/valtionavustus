import React, { useEffect, useState } from 'react'
import { Moment } from 'moment'

import DateUtil from 'soresu-form/web/DateUtil'
import { AVUSTUSHAKU_STATUSES, AvustushakuStatus, HelpTexts } from 'soresu-form/web/va/types'

import { HakuRoles } from './HakuRoles'
import AutoCompleteCodeValue, { CodeType } from '../../common-components/AutoCompleteCodeValue'
import { CustomHelpTooltip } from '../../common-components/HelpTooltip'
import WarningBanner from '../../WarningBanner'
import { VaCodeValue, ValidationResult } from '../../types'
import { DateInput } from './DateInput'
import { Raportointivelvoitteet } from './Raportointivelvoitteet'
import { Lainsaadanto } from './Lainsaadanto'
import ProjectSelectors from './ProjectSelectors'

import './koodien-valinta.less'
import { useHakujenHallintaDispatch, useHakujenHallintaSelector } from '../hakujenHallintaStore'
import {
  addFocusArea,
  addSelectionCriteria,
  VirkailijaAvustushaku,
  createHaku,
  deleteFocusArea,
  removeSelectionCriteria,
  selectLoadedInitialData,
  startAutoSaveForAvustushaku,
  updateField,
} from '../hakuReducer'
import { Talousarviotilit } from './Talousarviotilit'
import { tryToUseCurrentAvustushaku, useCurrentAvustushaku } from '../useAvustushaku'
import { useSearchParams } from 'react-router-dom'
import ChooseAvustushaku from './ChooseAvustushaku'
import { avustushakuStatusDescription } from '../status'
import { ScrollAwareValidationContainer } from './ValidationContainer'
import * as validationContainerStyles from './ValidationContainer.module.less'

export const HakuEdit = () => {
  const avustushaku = tryToUseCurrentAvustushaku()
  if (!avustushaku) {
    return <ChooseAvustushaku />
  }
  return <HakuEditor />
}

const HakuEditor = () => {
  const avustushaku = useCurrentAvustushaku()
  const { codeOptions, lainsaadantoOptions, helpTexts, userInfo } =
    useHakujenHallintaSelector(selectLoadedInitialData)
  const loadingAvustushaku = useHakujenHallintaSelector(
    (state) => state.haku.loadStatus.loadingAvustushaku
  )
  const hasPayments = !!avustushaku.payments?.length
  const dispatch = useHakujenHallintaDispatch()
  const isAllPaymentsPaid =
    hasPayments && !avustushaku.payments?.find((p) => p['paymentstatus-id'] !== 'paid')
  const userHasEditPrivilege = !!avustushaku.privileges?.['edit-haku']
  const allowAllHakuEdits =
    !loadingAvustushaku &&
    userHasEditPrivilege &&
    (avustushaku.status === 'new' || avustushaku.status === 'draft')
  const allowNondisruptiveHakuEdits =
    !loadingAvustushaku &&
    userHasEditPrivilege &&
    (allowAllHakuEdits || avustushaku.phase === 'current' || avustushaku.phase === 'upcoming')
  const userHasEditMyHakuRolePrivilege = !!avustushaku.privileges?.['edit-my-haku-role']
  const selectedValueOperationalUnit = codeOptions.find(
    (k) => k.id === avustushaku['operational-unit-id']
  )

  const [validationResult, setValidationResult] = useState<ValidationResult | undefined>()
  const [highlightValidationErrorByScaling, setHighlightValidationErrorByScaling] = useState(false)

  const onChangeListener = (target: EventTarget & HTMLElement, value: string) => {
    dispatch(updateField({ avustushaku, field: target, newValue: value }))
  }

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (e.target.id.startsWith('set-status-') && e.target.value === 'published') {
      if (
        !(
          avustushaku.muutoshakukelpoisuus?.['erroneous-fields'].length === 1 &&
          avustushaku.muutoshakukelpoisuus['erroneous-fields'][0].id === 'financing-plan'
        )
      ) {
        // If validation result already exists, trigger animation
        if (validationResult) {
          setHighlightValidationErrorByScaling(true)
          setTimeout(() => setHighlightValidationErrorByScaling(false), 400)
        }
        setValidationResult(avustushaku.muutoshakukelpoisuus)
      }
      if (!avustushaku.muutoshakukelpoisuus?.['is-ok']) {
        return
      }
    }
    onChangeListener(e.target, e.target.value)
  }

  const onChangeDateInput = (id: string, date: Moment) => {
    dispatch(
      updateField({
        avustushaku,
        field: { id },
        newValue: date.format('YYYY-MM-DD'),
      })
    )
  }

  const onChangeTrimWs = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeListener(e.target, e.target.value.replace(/\s/g, ' '))
  }

  const mainHelp = {
    __html: helpTexts['hakujen_hallinta__haun_tiedot___ohje'],
  }

  const updateCodeValue =
    (id: CodeType, avustushaku: VirkailijaAvustushaku) => (option: VaCodeValue | null) => {
      if (option == null) {
        dispatch(updateField({ avustushaku, field: { id }, newValue: null }))
      } else {
        dispatch(
          updateField({
            avustushaku,
            field: { id },
            newValue: option.id,
          })
        )
      }
    }
  return (
    <div id="haku-edit">
      <div dangerouslySetInnerHTML={mainHelp}></div>
      {!avustushaku.muutoshakukelpoinen && (
        <WarningBanner>
          <div data-test-id="muutoshakukelvoton-warning">
            <p>
              <b>Huom.!</b> Uusi muutoshakutoiminnallisuus ei ole käytössä tälle avustushaulle.
            </p>
            <ul>
              <li>Avustushaun päätöksiin ei tule linkkiä uudelle muutoshakusivulle</li>
            </ul>
          </div>
        </WarningBanner>
      )}
      {validationResult && avustushaku.muutoshakukelpoisuus && (
        <ScrollAwareValidationContainer
          result={avustushaku.muutoshakukelpoisuus}
          avustushakuMuutoshakukelpoinen={avustushaku.muutoshakukelpoinen}
          extraClasses={
            highlightValidationErrorByScaling ? validationContainerStyles.scaleAnimation : ''
          }
          errorTexts={{
            single:
              'Avustushaun lomakkeelta puuttuu tarpeellinen yhteystietokenttä. Avustushaun julkaiseminen ei ole mahdollista.',
            multiple: (numberOfErrors) =>
              `Avustushaun lomakkeelta puuttuu ${numberOfErrors} tarpeellista yhteystietokenttää. Avustushaun julkaiseminen ei ole mahdollista.`,
          }}
        />
      )}
      <div id="haku-edit-header" className="editor-header">
        <div>
          <RegisterNumber
            avustushaku={avustushaku}
            allowAllHakuEdits={allowAllHakuEdits}
            onChange={onChange}
            helpTexts={helpTexts}
          />
        </div>
        <div>
          <HallinnoiavustuksiaRegisterNumber
            avustushaku={avustushaku}
            allowAllHakuEdits={allowAllHakuEdits}
            onChange={onChange}
            helpTexts={helpTexts}
          />
        </div>

        <div className="editor-header-element">
          <CreateHaku avustushaku={avustushaku} helpTexts={helpTexts} />
        </div>
      </div>
      <table id="name" className="translation">
        <thead>
          <tr>
            <th>
              Haun nimi
              <CustomHelpTooltip
                content={helpTexts['hakujen_hallinta__haun_tiedot___haun_nimi']}
                direction="left"
              />
            </th>
            <th>Haun nimi ruotsiksi</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <textarea
                id="haku-name-fi"
                rows={2}
                maxLength={200}
                value={avustushaku.content.name.fi}
                onChange={onChangeTrimWs}
                disabled={!allowNondisruptiveHakuEdits}
              />
            </td>
            <td>
              <textarea
                id="haku-name-sv"
                rows={2}
                maxLength={200}
                value={avustushaku.content.name.sv}
                onChange={onChangeTrimWs}
                disabled={!allowNondisruptiveHakuEdits}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="koodien-valinta">
        <div
          className="koodien-valinta-elementti"
          data-test-id="code-value-dropdown__operational-unit"
        >
          <h3 className="koodien-valinta-otsikko required">
            Toimintayksikkö
            <CustomHelpTooltip
              content={helpTexts['hakujen_hallinta__haun_tiedot___toimintayksikkö']}
              direction="left"
            />
          </h3>
          <AutoCompleteCodeValue
            codeType="operational-unit-id"
            codeOptions={codeOptions.filter((k) => k['value-type'] === 'operational-unit')}
            selectedValue={selectedValueOperationalUnit}
            disabled={isAllPaymentsPaid || loadingAvustushaku}
            updateValue={updateCodeValue('operational-unit-id', avustushaku)}
          />
        </div>
        <div className="koodien-valinta-elementti" data-test-id="code-value-dropdown__project">
          <h3 className="koodien-valinta-otsikko required">
            Projekti
            <CustomHelpTooltip
              content={helpTexts['hakujen_hallinta__haun_tiedot___projekti']}
              direction="left"
            />
          </h3>
          <ProjectSelectors
            avustushaku={avustushaku}
            codeOptions={codeOptions.filter((k) => k['value-type'] === 'project')}
            disabled={isAllPaymentsPaid || loadingAvustushaku}
          />
        </div>
      </div>
      <div className="two-column-container">
        <div>
          <SetStatus
            hakuIsValid={checkIfAvustushakuIsValid(avustushaku)}
            currentStatus={avustushaku.status}
            userHasEditPrivilege={userHasEditPrivilege}
            onChange={onChange}
            helpTexts={helpTexts}
          />
          <div className="haku-duration-and-self-financing">
            <div className="haku-duration-edit-container">
              <h3>
                {avustushaku.content.duration.label.fi}
                <CustomHelpTooltip
                  content={helpTexts['hakujen_hallinta__haun_tiedot___hakuaika']}
                  direction="left"
                />
              </h3>
              <DateField
                id="hakuaika-start"
                onBlur={onChange}
                avustushakuId={avustushaku.id}
                value={avustushaku.content.duration.start}
                disabled={!allowAllHakuEdits}
              />
              <span className="dateDivider" />
              <DateField
                id="hakuaika-end"
                onBlur={onChange}
                avustushakuId={avustushaku.id}
                value={avustushaku.content.duration.end}
                disabled={!allowNondisruptiveHakuEdits}
              />
            </div>
          </div>
          <HakuType
            hakuType={avustushaku['haku-type']}
            disabled={!allowAllHakuEdits}
            onChange={onChange}
            helpTexts={helpTexts}
          />
          <AcademySize
            value={avustushaku.is_academysize}
            disabled={!allowAllHakuEdits}
            onChange={onChange}
            helpTexts={helpTexts}
          />
        </div>
        <div>
          <div>
            <h3>Salli tietojen automaattinen siirtyminen www.oph.fi-sivustolle</h3>
            <fieldset className="soresu-radiobutton-group">
              <span>
                <input
                  id="allow_visibility_in_external_system_true"
                  type="radio"
                  name="allow_visibility_in_external_system"
                  value="true"
                  onChange={onChange}
                  checked={avustushaku.allow_visibility_in_external_system}
                />
                <label htmlFor="allow_visibility_in_external_system_true">Kyllä</label>
              </span>
              <span>
                <input
                  id="allow_visibility_in_external_system_false"
                  type="radio"
                  name="allow_visibility_in_external_system"
                  value="false"
                  onChange={onChange}
                  checked={!avustushaku.allow_visibility_in_external_system}
                />
                <label htmlFor="allow_visibility_in_external_system_false">Ei</label>
              </span>
            </fieldset>
          </div>
          <div>
            <h3>Muutoshakukelpoinen</h3>
            <fieldset className="soresu-radiobutton-group">
              <span>
                <input
                  id="muutoshakukelpoinen_true"
                  type="radio"
                  name="muutoshakukelpoinen"
                  value="true"
                  onChange={onChange}
                  checked={avustushaku.muutoshakukelpoinen}
                  disabled={!allowAllHakuEdits}
                />
                <label htmlFor="muutoshakukelpoinen_true">Kyllä</label>
              </span>
              <span>
                <input
                  id="muutoshakukelpoinen_false"
                  type="radio"
                  name="muutoshakukelpoinen"
                  value="false"
                  onChange={onChange}
                  checked={!avustushaku.muutoshakukelpoinen}
                  disabled={!allowAllHakuEdits}
                />
                <label htmlFor="muutoshakukelpoinen_false">Ei</label>
              </span>
            </fieldset>
          </div>
        </div>
      </div>
      <Lainsaadanto
        avustushaku={avustushaku}
        lainsaadantoOptions={lainsaadantoOptions}
        helpTexts={helpTexts}
      />
      <Talousarviotilit helpTexts={helpTexts} />
      <div>
        <div className="multibatch-fields">
          <h3>
            Maksatus
            <CustomHelpTooltip
              content={helpTexts['hakujen_hallinta__haun_tiedot___maksatus']}
              direction="left"
            />
          </h3>
          <div>
            <div className="haku-edit-field-container">
              <Maksuerat
                value={avustushaku.content.multiplemaksuera}
                disabled={!allowAllHakuEdits}
                onChange={onChange}
              />
            </div>
            <div className="haku-edit-field-container">
              <h3>
                Hakijan omarahoitusvaatimus
                <CustomHelpTooltip
                  content={helpTexts['hakujen_hallinta__haun_tiedot___hakijan_omarahoitusvaatimus']}
                />
              </h3>
              <input
                id="haku-self-financing-percentage"
                type="number"
                min="0"
                max="99"
                className="percentage"
                required={true}
                maxLength={2}
                onChange={onChange}
                disabled={!allowAllHakuEdits}
                value={avustushaku.content['self-financing-percentage']}
              />
              <span>%</span>
            </div>
          </div>
          <div
            title={
              avustushaku.content.multiplemaksuera && allowAllHakuEdits && hasPayments
                ? 'Avustuksen maksatuksia on jo luotu, joten arvoja ei voi enää muuttaa'
                : undefined
            }
          >
            <div
              className={
                avustushaku.content.multiplemaksuera && allowAllHakuEdits && !hasPayments
                  ? undefined
                  : 'haku-edit-disabled-form'
              }
            >
              <div>
                <label className="haku-edit-radio-button-item">
                  <input
                    type="radio"
                    name="payment-size-limit"
                    value="no-limit"
                    checked={avustushaku.content['payment-size-limit'] === 'no-limit'}
                    className="haku-edit-radio-button"
                    onChange={onChange}
                    id="payment-size-limit-1"
                  />
                  Kaikille avustuksen saajille maksetaan useammassa erässä
                </label>
                <label className="haku-edit-radio-button-item">
                  <input
                    type="radio"
                    name="payment-size-limit"
                    value="fixed-limit"
                    checked={avustushaku.content['payment-size-limit'] === 'fixed-limit'}
                    className="haku-edit-radio-button"
                    onChange={onChange}
                    id="payment-size-limit-2"
                  />
                  Maksetaan useammassa erässä, kun OPH:n avustus hankkeelle (ts. maksettava
                  kokonaissumma) on vähintään
                  <input
                    className="haku-edit-inline-input"
                    type="number"
                    id="payment-fixed-limit"
                    disabled={avustushaku.content['payment-size-limit'] !== 'fixed-limit'}
                    onChange={onChange}
                    value={avustushaku.content['payment-fixed-limit'] || ''}
                  />
                  <span>€</span>
                </label>
              </div>
              <div className="haku-edit-subrow">
                <label className="haku-edit-field-label">
                  Ensimmäisen erän osuus OPH:n avustuksesta hankkeelle (ts. maksettava
                  kokonaissumma) on vähintään
                  <input
                    type="number"
                    className="haku-edit-inline-input"
                    id="payment-min-first-batch"
                    onChange={onChange}
                    value={avustushaku.content['payment-min-first-batch'] || ''}
                  />
                  <span>%</span>
                </label>
              </div>
            </div>
          </div>
          <div className="payments-fields">
            <div className="haku-edit-field-container">
              <label>
                <h3>
                  Maksuliikemenotili
                  <CustomHelpTooltip
                    content={helpTexts['hakujen_hallinta__haun_tiedot___maksuliikennemenotili']}
                    direction="left"
                  />
                </h3>
                <select
                  id="transaction-account"
                  onChange={onChange}
                  name="transaction-account"
                  value={avustushaku.content['transaction-account'] || ''}
                >
                  <option value=""></option>
                  <option value="5000">5000</option>
                  <option value="5220">5220</option>
                  <option value="5230">5230</option>
                  <option value="5240">5240</option>
                  <option value="5250">5250</option>
                </select>
              </label>
            </div>
            <div className="haku-edit-field-container">
              <label>
                <h3>
                  Tositelaji
                  <CustomHelpTooltip
                    content={helpTexts['hakujen_hallinta__haun_tiedot___tositelaji']}
                  />
                </h3>
                <select
                  id="document-type"
                  onChange={onChange}
                  name="document-type"
                  value={avustushaku.content['document-type'] || ''}
                >
                  <option value=""></option>
                  <option value="XE">XE</option>
                </select>
              </label>
            </div>
          </div>
        </div>
        <div className="editor-field-row">
          <div>
            <h3 className="required">
              Määräraha
              <CustomHelpTooltip
                content={helpTexts['hakujen_hallinta__haun_tiedot___määräraha']}
                direction="left"
              />
            </h3>
            <div className="money_input">
              <input
                id="total-grant-size"
                pattern="[0-9]+"
                disabled={!allowAllHakuEdits}
                onChange={onChange}
                required={true}
                value={avustushaku.content['total-grant-size'] || ''}
              />
            </div>
          </div>
          <div>
            <h3>
              Arvioitu maksupäivä
              <CustomHelpTooltip
                content={helpTexts['hakujen_hallinta__haun_tiedot___arvioitu_maksupäivä']}
                direction="left"
              />
            </h3>
            <DateInput
              id="arvioitu_maksupaiva"
              onChange={onChangeDateInput}
              defaultValue={
                avustushaku.arvioitu_maksupaiva
                  ? new Date(avustushaku.arvioitu_maksupaiva)
                  : undefined
              }
              allowEmpty={true}
              placeholder="Päivämäärä"
            />
          </div>
        </div>
      </div>
      <hr className="spacer" />
      <Raportointivelvoitteet avustushaku={avustushaku} helpTexts={helpTexts} />
      <hr className="spacer" />
      <HakuRoles
        avustushaku={avustushaku}
        userInfo={userInfo}
        userHasEditPrivilege={userHasEditPrivilege}
        userHasEditMyHakuRolePrivilege={userHasEditMyHakuRolePrivilege}
        helpTexts={helpTexts}
      />
      <hr className="spacer" />
      <SelectionCriteria
        avustushaku={avustushaku}
        allowAllHakuEdits={allowAllHakuEdits}
        allowNondisruptiveHakuEdits={allowNondisruptiveHakuEdits}
        onChange={onChange}
        helpTexts={helpTexts}
      />
      <hr className="spacer" />
      <FocusArea
        avustushaku={avustushaku}
        allowAllHakuEdits={allowAllHakuEdits}
        allowNondisruptiveHakuEdits={allowNondisruptiveHakuEdits}
        onChange={onChange}
        helpTexts={helpTexts}
      />
    </div>
  )
}

type CreateHakuProps = {
  avustushaku: VirkailijaAvustushaku
  helpTexts: HelpTexts
}

const CreateHaku = ({ avustushaku, helpTexts }: CreateHakuProps) => {
  const dispatch = useHakujenHallintaDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  async function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const newAvustushakuId = await dispatch(createHaku(avustushaku.id))
    searchParams.set('avustushaku', String(newAvustushakuId.payload))
    setSearchParams(searchParams)
    // @ts-ignore
    e.target.blur()
    e.preventDefault()
  }
  return (
    <span>
      <a id="create-haku" onClick={onClick}>
        Kopioi uuden pohjaksi
      </a>
      <CustomHelpTooltip
        content={helpTexts['hakujen_hallinta__haun_tiedot___kopioi_uuden_pohjaksi']}
        direction="right"
      />
    </span>
  )
}

type DateFieldProps = {
  id: string
  disabled: boolean
  avustushakuId: number
  value: string | Date
  onBlur: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const asDateTimeString = (value: string | Date) => {
  return DateUtil.asDateString(value) + ' ' + DateUtil.asTimeString(value)
}

const DateField = ({ id, disabled, avustushakuId, value, onBlur }: DateFieldProps) => {
  const [currentValue, setCurrentValue] = useState(asDateTimeString(value))

  useEffect(() => {
    setCurrentValue(asDateTimeString(value))
  }, [avustushakuId, setCurrentValue])

  return (
    <input
      className="date"
      maxLength={16}
      size={16}
      type="text"
      id={id}
      onChange={(e) => setCurrentValue(e.target.value)}
      onBlur={onBlur}
      value={currentValue}
      disabled={disabled}
    />
  )
}

type TextAreaProps = {
  allowAllHakuEdits: boolean
  allowNondisruptiveHakuEdits: boolean
  avustushaku: VirkailijaAvustushaku
  helpTexts: HelpTexts
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const SelectionCriteria = ({
  allowAllHakuEdits,
  allowNondisruptiveHakuEdits,
  avustushaku,
  onChange,
  helpTexts,
}: TextAreaProps) => {
  const selectionCriteria = avustushaku.content['selection-criteria']
  const dispatch = useHakujenHallintaDispatch()
  const criteriaItems = []
  for (let index = 0; index < selectionCriteria.items.length; index++) {
    const htmlId = 'selection-criteria-' + index + '-'
    criteriaItems.push(
      <tr key={index}>
        <td>
          <textarea
            onChange={onChange}
            rows={2}
            id={htmlId + 'fi'}
            value={selectionCriteria.items[index].fi}
            disabled={!allowNondisruptiveHakuEdits}
          />
        </td>
        <td>
          <textarea
            onChange={onChange}
            rows={2}
            id={htmlId + 'sv'}
            value={selectionCriteria.items[index].sv}
            disabled={!allowNondisruptiveHakuEdits}
          />
        </td>
        <td>
          <button
            type="button"
            className="remove"
            onClick={() => {
              dispatch(
                removeSelectionCriteria({
                  avustushakuId: avustushaku.id,
                  index,
                })
              )
              dispatch(startAutoSaveForAvustushaku(avustushaku.id))
            }}
            title="Poista"
            tabIndex={-1}
            disabled={!allowAllHakuEdits}
          />
        </td>
      </tr>
    )
  }

  return (
    <table id="selection-criteria" className="translation">
      <thead>
        <tr>
          <th>
            {selectionCriteria.label.fi}
            <CustomHelpTooltip
              content={helpTexts['hakujen_hallinta__haun_tiedot___valintaperusteet']}
              direction="left"
            />
          </th>
          <th>{selectionCriteria.label.sv}</th>
        </tr>
      </thead>
      <tbody>{criteriaItems}</tbody>
      <tfoot>
        <tr>
          <td>
            <button
              type="button"
              disabled={!allowAllHakuEdits}
              onClick={() => {
                dispatch(addSelectionCriteria({ avustushakuId: avustushaku.id }))
                dispatch(startAutoSaveForAvustushaku(avustushaku.id))
              }}
              data-test-id="add-selection-criteria"
            >
              Lisää uusi valintaperuste
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

const FocusArea = ({
  allowAllHakuEdits,
  allowNondisruptiveHakuEdits,
  avustushaku,
  onChange,
  helpTexts,
}: TextAreaProps) => {
  const dispatch = useHakujenHallintaDispatch()
  const focusAreas = avustushaku.content['focus-areas']
  const focusAreaItems = []
  for (let index = 0; index < focusAreas.items.length; index++) {
    const htmlId = 'focus-area-' + index + '-'
    focusAreaItems.push(
      <tr key={index}>
        <td>
          <textarea
            onChange={onChange}
            rows={3}
            id={htmlId + 'fi'}
            value={focusAreas.items[index].fi}
            disabled={!allowNondisruptiveHakuEdits}
          />
        </td>
        <td>
          <textarea
            onChange={onChange}
            rows={3}
            id={htmlId + 'sv'}
            value={focusAreas.items[index].sv}
            disabled={!allowNondisruptiveHakuEdits}
          />
        </td>
        <td>
          <button
            type="button"
            className="remove"
            onClick={() => {
              dispatch(deleteFocusArea({ avustushakuId: avustushaku.id, index }))
              dispatch(startAutoSaveForAvustushaku(avustushaku.id))
            }}
            title="Poista"
            tabIndex={-1}
            disabled={!allowAllHakuEdits}
          />
        </td>
      </tr>
    )
  }

  return (
    <table id="focus-areas" className="translation">
      <thead>
        <tr>
          <th>
            {focusAreas.label.fi}
            <CustomHelpTooltip
              content={helpTexts['hakujen_hallinta__haun_tiedot___painopistealueet']}
              direction="left"
            />
          </th>
          <th>{focusAreas.label.sv}</th>
        </tr>
      </thead>
      <tbody>{focusAreaItems}</tbody>
      <tfoot>
        <tr>
          <td>
            <button
              type="button"
              disabled={!allowAllHakuEdits}
              onClick={() => {
                dispatch(addFocusArea({ avustushakuId: avustushaku.id }))
                dispatch(startAutoSaveForAvustushaku(avustushaku.id))
              }}
            >
              Lisää uusi painopistealue
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

type HakuTypeProps = {
  hakuType: string
  disabled: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  helpTexts: HelpTexts
}

const HakuType = ({ hakuType, disabled, onChange, helpTexts }: HakuTypeProps) => {
  const options = [
    {
      htmlId: 'set-haku-type-yleisavustus',
      value: 'yleisavustus',
      label: 'Yleisavustus',
    },
    {
      htmlId: 'set-haku-type-eritysavustus',
      value: 'erityisavustus',
      label: 'Erityisavustus',
    },
  ]
    .map((spec) => [
      <input
        id={spec.htmlId}
        key={spec.htmlId}
        type="radio"
        name="haku-type"
        value={spec.value}
        onChange={onChange}
        checked={spec.value === hakuType}
        disabled={disabled}
      />,
      <label key={spec.htmlId + '-label'} htmlFor={spec.htmlId}>
        {spec.label}
      </label>,
    ])
    .flat()
  return (
    <div id="set-haku-type">
      <h3>
        Avustuslaji
        <CustomHelpTooltip
          content={helpTexts['hakujen_hallinta__haun_tiedot___hakutyyppi']}
          direction="left"
        />
      </h3>
      <fieldset className="soresu-radiobutton-group">{options}</fieldset>
    </div>
  )
}

type AcademySizeProps = {
  value: boolean
  disabled: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  helpTexts: HelpTexts
}

const AcademySize = ({ value, disabled, onChange, helpTexts }: AcademySizeProps) => {
  const initialValue = value ? 'true' : 'false'
  const values = ['false', 'true']

  const options = values.map((optionValue) => {
    const htmlId = 'set-is_academysize-' + optionValue
    return (
      <span key={`span-${htmlId}`}>
        <input
          id={htmlId}
          type="radio"
          key={htmlId}
          name="is_academysize"
          value={optionValue}
          onChange={onChange}
          checked={optionValue === initialValue}
          disabled={disabled}
        />
        <label key={htmlId + '-label'} htmlFor={htmlId}>
          {optionValue === 'true' ? 'Valmistelija lisää oppilaitoksen koon' : 'Ei käytössä'}
        </label>
      </span>
    )
  })

  return (
    <div id="set-academysize">
      <h3>
        Oppilaitoksen koko
        <CustomHelpTooltip
          content={helpTexts['hakujen_hallinta__haun_tiedot___oppilaitoksen_koko']}
          direction="left"
        />
      </h3>
      <fieldset className="soresu-radiobutton-group">{options}</fieldset>
    </div>
  )
}

type MaksueratProps = {
  value: boolean | undefined
  disabled: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Maksuerat = ({ value, disabled, onChange }: MaksueratProps) => {
  const multipleRahoitusalue = value ? 'true' : 'false'
  const options = [
    { label: 'Yksi maksuerä', value: 'false' },
    { label: 'Useampi maksuerä', value: 'true' },
  ]
  const optionsHtml = options.map((option) => {
    const optionValue = option.value
    const htmlId = 'set-maksuera-' + optionValue
    return (
      <span key={`span-${htmlId}`}>
        <input
          id={htmlId}
          type="radio"
          key={htmlId}
          name="maksuera"
          value={optionValue}
          onChange={onChange}
          checked={optionValue === multipleRahoitusalue}
          disabled={disabled}
        />
        <label key={htmlId + '-label'} htmlFor={htmlId}>
          {option.label}
        </label>
      </span>
    )
  })

  return (
    <div id="set-maksuerat">
      <fieldset className="soresu-radiobutton-group">{optionsHtml}</fieldset>
    </div>
  )
}

type SetStatusProps = {
  currentStatus: AvustushakuStatus
  hakuIsValid: boolean
  helpTexts: HelpTexts
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  userHasEditPrivilege: boolean
}

const SetStatus = ({
  currentStatus,
  hakuIsValid,
  helpTexts,
  onChange,
  userHasEditPrivilege,
}: SetStatusProps) => {
  const isDisabled = function (status: string) {
    return (
      !userHasEditPrivilege ||
      (status === 'deleted' && currentStatus !== 'draft') ||
      (status === 'draft' && currentStatus === 'resolved') ||
      (status === 'published' && !hakuIsValid) ||
      (status === 'resolved' && currentStatus !== 'published')
    )
  }

  const statuses = AVUSTUSHAKU_STATUSES.filter((s) => s !== 'new').map((status) => {
    const htmlId = 'set-status-' + status
    return (
      <span key={`span-${htmlId}`}>
        <input
          id={htmlId}
          type="radio"
          key={htmlId}
          name="status"
          value={status}
          onChange={onChange}
          checked={status === currentStatus}
          disabled={isDisabled(status)}
        />
        <label key={htmlId + '-label'} htmlFor={htmlId}>
          {avustushakuStatusDescription[status]}
        </label>
      </span>
    )
  })

  return (
    <div>
      <h3>
        Tila
        <CustomHelpTooltip
          content={helpTexts['hakujen_hallinta__haun_tiedot___tila']}
          direction="left"
        />
      </h3>
      <fieldset className="soresu-radiobutton-group">{statuses}</fieldset>
    </div>
  )
}

type RegisterNumberProps = {
  allowAllHakuEdits: boolean
  avustushaku: VirkailijaAvustushaku
  helpTexts: HelpTexts
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const isValidRegisterNumber = (registerNumber: string | null) => {
  return registerNumber == null ? false : /^\d{1,5}\/\d{2,6}$/.test(registerNumber)
}

const RegisterNumber = ({
  avustushaku,
  allowAllHakuEdits,
  helpTexts,
  onChange,
}: RegisterNumberProps) => {
  const registerNumber = avustushaku['register-number'] || ''
  const isRegisterNumberValid = isValidRegisterNumber(avustushaku['register-number'])
  const registerNumberClass = isRegisterNumberValid ? '' : 'error'
  const errorStyle = { paddingLeft: '5px' }
  let errorString = <span></span>
  if (!registerNumber) {
    errorString = (
      <span style={errorStyle} className="error">
        Asianumero on pakollinen tieto
      </span>
    )
  } else if (!isRegisterNumberValid) {
    errorString = (
      <span style={errorStyle} className="error">
        Asianumero ei ole oikean muotoinen (esim. 340/2015)
      </span>
    )
  }

  return (
    <div>
      <h3 className="required registerNumberHeading">
        Asianumero
        <CustomHelpTooltip
          content={helpTexts['hakujen_hallinta__haun_tiedot___asianumero']}
          direction="left"
        />
      </h3>
      <input
        type="text"
        disabled={!allowAllHakuEdits}
        onChange={onChange}
        className={registerNumberClass}
        maxLength={128}
        placeholder="Esim. 340/2015"
        id="register-number"
        value={registerNumber}
      />
      <div>{errorString}</div>
    </div>
  )
}
const HallinnoiavustuksiaRegisterNumber = ({
  avustushaku,
  allowAllHakuEdits,
  helpTexts,
  onChange,
}: RegisterNumberProps) => {
  const registerNumber = avustushaku['hallinnoiavustuksia-register-number'] || ''
  return (
    <div>
      <h3 className="registerNumberHeading">
        Asianumero hallinnoiavustuksia.fi-palvelussa
        <CustomHelpTooltip
          content={helpTexts['hakujen_hallinta__haun_tiedot___hallinnoiavustuksia_asianumero']}
          direction="up"
        />
      </h3>
      <input
        type="text"
        disabled={!allowAllHakuEdits}
        onChange={onChange}
        maxLength={128}
        placeholder="Esim. va-oph-2023-6"
        id="hallinnoiavustuksia-register-number"
        value={registerNumber}
      />
    </div>
  )
}

function checkIfAvustushakuIsValid(avustushaku: VirkailijaAvustushaku) {
  return (
    isValidRegisterNumber(avustushaku['register-number']) &&
    avustushaku['hankkeen-alkamispaiva'] != null &&
    avustushaku['hankkeen-paattymispaiva'] != null
  )
}
