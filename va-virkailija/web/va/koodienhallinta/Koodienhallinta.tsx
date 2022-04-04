import React, {
  useEffect,
  useReducer,
  useState
} from "react";
import * as yup from "yup"
import {ValueType, valueTypes} from "./types";

import {VaCodeValue} from "../types";
import {IconLockOpen} from "./IconLockOpen";
import {IconLockClosed} from "./IconLockClosed";
import {IconDelete} from "./IconDelete";
import HttpUtil, {getHttpResponseErrorStatus} from "soresu-form/web/HttpUtil";
import {
  Field,
  FormikProps,
  withFormik
} from "formik";

import './Koodienhallinta.less'

const tabName = {
 'operational-unit': 'Toimintayksikkö',
  project: 'Projekti',
  operation: 'Toiminto'
} as const

interface OphTabProps {
  valueType: ValueType
  selectedValueType: ValueType
  onClick: (valueType: ValueType) => void
}

const OphTab: React.FC<OphTabProps> = ({valueType, selectedValueType, onClick}) => {
  const classes = valueType === selectedValueType
    ? 'oph-tab-item oph-tab-item-is-active'
    : 'oph-tab-item'
  return (
    <a className={classes}
       data-test-id={`code-value-tab-${valueType}`}
       onClick={e => {
         e.preventDefault()
         onClick(valueType)
       }}>
      {tabName[valueType]}
    </a>
  )
}

const OphTabs: React.FC<{selectedTab: ValueType, onTabSelect: (valueType: ValueType) => void}>
  = ({selectedTab, onTabSelect}) => {
  return (
    <div className="oph-tabs oph-typography">
      <OphTab valueType="operational-unit" selectedValueType={selectedTab} onClick={onTabSelect} />
      <OphTab valueType="project" selectedValueType={selectedTab} onClick={onTabSelect} />
      <OphTab valueType="operation" selectedValueType={selectedTab} onClick={onTabSelect}/>
    </div>
  )
}

interface CodeInputValues {
  year: string
  code: string
  'code-value': string
  'value-type': ValueType
}

const getInitialCodeInputState = (selectedTab: ValueType) => ({year: '', code: '', ['code-value']: '', ['value-type']: selectedTab})

const VaCodeValueSchema = yup.object().shape({
  year: yup.number()
    .min(1970, 'Vuosi voi olla minimissään 1970')
    .max(2100, 'Vuosi voi olla maksimissaan 2100')
    .required("Vuosi on pakollinen"),
  code: yup.string().required("Koodi on pakollinen"),
  'code-value': yup.string().required('Nimi on pakollinen'),
  'value-type': yup.string().oneOf(valueTypes).required('value-type on pakollinen')
})

const CodeInput = (props: {onActionSuccess: () => void, selectedTab: ValueType} & FormikProps<CodeInputValues>) => {
  const {touched, errors, resetForm, isSubmitting, selectedTab, handleSubmit, isValid, dirty} = props
  useEffect(() => {
    function resetFormOnTabChange() {
      resetForm({
        values: getInitialCodeInputState(selectedTab)
      })
    }
    resetFormOnTabChange()
  }, [selectedTab])
  const submitDisabled = isSubmitting || !(isValid && dirty)
  return (
    <form onSubmit={handleSubmit}>
      <div className="code-input-container">
        <div className="code-input code-input__year">
          <label className="oph-label" htmlFor="year">Vuosi</label>
          <Field id="year" name="year" data-test-id="code-form__year" className="oph-input"/>
        </div>
        <div className="code-input code-input__code">
          <label className="oph-label" htmlFor="code">Koodi</label>
          <Field id="code" name="code" data-test-id="code-form__code" className="oph-input"/>
        </div>
        <div className="code-input code-input__name">
          <label className="oph-label" htmlFor="code-value">Nimi</label>
          <Field id="code-value" name="code-value" data-test-id="code-form__name" className="oph-input" />
        </div>
        <button disabled={submitDisabled} type="submit" className="oph-button oph-button-disabled oph-button-primary code-input-submit" data-test-id="code-form__add-button">
          Lisää
        </button>
        {isSubmitting && <div className="code-input-saving">Tallennetaan...</div>}
      </div>
      {touched.year && errors.year && <div className="code-input-error">{errors.year}</div>}
      {touched.code && errors.code && <div className="code-input-error">{errors.code}</div>}
      {touched["code-value"] && errors["code-value"] && <div className="code-input-error">{errors["code-value"]}</div>}
      {touched["value-type"] && errors["value-type"] && <div className="code-input-error">{errors["value-type"]}</div>}
    </form>
  )
}

const CodeInputForm = withFormik<{selectedTab: ValueType, onActionSuccess: () => void}, CodeInputValues>({
  mapPropsToValues: ({selectedTab}) => getInitialCodeInputState(selectedTab),
  validationSchema: VaCodeValueSchema,
  handleSubmit: async (values, actions) => {
    try {
      await HttpUtil.post('/api/v2/va-code-values/', {...values, year: Number(values.year)})
      actions.resetForm({
        values: getInitialCodeInputState(actions.props.selectedTab)
      })
      actions.props.onActionSuccess()
    } finally {
      actions.setSubmitting(false)
    }
  }
})(CodeInput)

const CodeFilter = ({selectedTab, selectedYear, onSelect, onFilterWord}:{selectedTab: ValueType,selectedYear: string, onSelect: (year: string) => void, onFilterWord: (word: string) => void}) => {
  const [filterWord, setFilterWord] = useState('')
  useEffect(() => {
    setFilterWord('')
  }, [selectedTab])
  useEffect(() => {
    const handle = setTimeout(() => {
      onFilterWord(filterWord)
    }, 275)
    return () => {
      clearTimeout(handle)
    }
  }, [filterWord])
  return (
    <div className="code-input-container">
      <div className="code-input oph-select-container">
        <select className="oph-input oph-select" value={selectedYear} onChange={event => {
          onSelect(event.target.value)
        }}>
          {
            Array(21)
              .fill(2017)
              .map((year, index) => {
                const value = index === 0 ? '' : year + index
                return <option key={`year-filter-${value}`} value={value}>{value}</option>
              })
          }
        </select>
      </div>
      <div className="code-input">
        <input className="oph-input" value={filterWord} onChange={e => setFilterWord(e.target.value)} />
      </div>
    </div>
  )
}

const SkeletonCodes = () => {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const handle = setTimeout(() => setShow(true),  300)
    return () => {
      clearTimeout(handle)
    }
  }, [])
  return (
    <React.Fragment>
      {show && Array(5).fill(null).map((_, index) => (
        <tr key={`skeleton-tr-${index}`} data-test-id="loading-codes">
          <td className="loading"><div/></td>
          <td className="loading"><div/></td>
          <td className="loading"><div/></td>
          <td className="loading"><div/></td>
          <td className="loading"><div/></td>
        </tr>
      ))}
    </React.Fragment>
  )
}

const Codes = ({codes, onActionSuccess, isLoading}:{codes: VaCodeValue[], onActionSuccess: () => void, isLoading: boolean}) => {

  const getUrl = (codeId: number) => `/api/v2/va-code-values/${codeId}/`
  const deleteCode = (codeId: number) => async () => {
    if (window.confirm('Oletko aivan varma, että haluat poistaa koodin?')) {
      try {
        await HttpUtil.delete(getUrl(codeId))
        onActionSuccess()
      } catch (e) {
        if (getHttpResponseErrorStatus(e) === 405) {
          console.log('code already exists')
        } else {
          console.log('unknown error')
        }
      }
    }
  }
  const setCodeVisibility = (codeId: number, hidden: boolean) => async () => {
    await HttpUtil.post(getUrl(codeId), {hidden})
    onActionSuccess()
  }
  return (
    <table aria-busy={isLoading ? 'true' : 'false'} aria-live="polite">
      <colgroup>
        <col style={{width: '10%'}}/>
        <col style={{width: '24%'}}/>
        <col style={{width: '50%'}}/>
        <col style={{width: '8%'}}/>
        <col style={{width: '8%'}}/>
      </colgroup>
      <thead>
        <tr>
          <th className="code-cell">Vuosi</th>
          <th>Koodi</th>
          <th>Nimi</th>
          <th className="code-cell__buttons">Lukitse</th>
          <th className="code-cell__buttons">Poista</th>
        </tr>
      </thead>
      <tbody>
      {isLoading && <SkeletonCodes />}
      {!isLoading && codes.map((code) => {
        const fadeClass = code.hidden ? 'code-cell__hidden': ''
        return (
          <tr key={`code-${code.id}`} data-id={String(code.id)} data-test-id={`code-cell-${code.year}-${code.code}-${code["code-value"]}`}>
            <td className={fadeClass}>{code.year}</td>
            <td className={fadeClass}>{code.code}</td>
            <td className={fadeClass}>{code["code-value"]}</td>
            <td className="code-cell__buttons">
              <button data-test-id={code.hidden ? 'show-code' : 'hide-code'} className={`code-icon-button ${code.hidden ? 'code-icon-button__hidden' : ''}`} onClick={setCodeVisibility(code.id, !code.hidden)}>
                {
                  code.hidden
                    ? <IconLockClosed />
                    : <IconLockOpen/>
                }
              </button>
            </td>
            <td className="code-cell__buttons">
              <button data-test-id="delete-code" className="code-icon-button icon-delete" onClick={deleteCode(code.id)}>
                <IconDelete/>
              </button>
            </td>
          </tr>
        )})}
      </tbody>
    </table>
  )
}

interface State {
  selectedTab: ValueType
  filterYear: string
  isLoading: boolean
  codes: VaCodeValue[]
  codeRefetchTrigger: boolean
  filterWord: string
}

type Action =
  | { type: 'select-tab'; value: ValueType }
  | { type: 'set-filter-year'; value: string }
  | { type: 'code-load-request';}
  | { type: 'code-load-success'; value: VaCodeValue[]}
  | { type: 'code-load-error';}
  | { type: 'code-change-request';}
  | { type: 'code-change-success';}
  | { type: 'code-change-error';}
  | { type: 'trigger-code-refetch';}
  | { type: 'set-filter-word'; value: string}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "select-tab":
      return { ...state, filterYear: '', filterWord: '', selectedTab: action.value }
    case "set-filter-year":
      return { ...state, filterYear: action.value, codes: []}
    case "code-load-request":
      return {...state, isLoading: true}
    case "code-load-success":
      return {...state, isLoading: false, codes: action.value}
    case "code-load-error":
      return {...state, isLoading: false}
    case "trigger-code-refetch":
      return {...state, codeRefetchTrigger: !state.codeRefetchTrigger}
    case "set-filter-word":
      return {...state, filterWord: action.value}
    default:
      throw Error('unknown action')
  }
}

const initialState: State = {selectedTab: 'operational-unit', filterYear: '', isLoading: false, codes: [], codeRefetchTrigger: false, filterWord: ''}

export const Koodienhallinta = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {selectedTab, filterYear, codeRefetchTrigger, filterWord, codes, isLoading} = state
  useEffect(() => {
    let ignore = false
    async function fetchCodes() {
      const params = new URLSearchParams()
      params.set('value-type', selectedTab)
      if (filterYear !== '') {
        params.set('year', filterYear)
      }
      dispatch({type: 'code-load-request'})
      try {
        const [result] = await Promise.all([
          HttpUtil.get(`/api/v2/va-code-values?${params.toString()}`)
        ])
        if (!ignore) {
          dispatch({type: 'code-load-success', value: result})
        }
      } catch(e) {
        if (!ignore) {
          dispatch({type: 'code-load-error'})
        }
      }
    }
    fetchCodes()
    return () => {
      ignore = true
    }
  }, [selectedTab, filterYear, codeRefetchTrigger])
  const filteredCodes = filterWord !== ''
    ? codes.filter(code => code['code-value'].includes(filterWord))
    : codes
  return (
    <div className="koodienhallinta-container">
      <div className="koodienhallinta-body">
        <OphTabs selectedTab={selectedTab} onTabSelect={(tab) => dispatch({type: 'select-tab', value: tab})} />
        <CodeInputForm selectedTab={selectedTab} onActionSuccess={() => dispatch({type: 'trigger-code-refetch'})} />
        <hr />
        <CodeFilter selectedTab={selectedTab} selectedYear={filterYear} onSelect={year => dispatch({type: 'set-filter-year', value: year})} onFilterWord={word => dispatch({type: 'set-filter-word', value: word})}/>
        <Codes isLoading={isLoading} codes={filteredCodes} onActionSuccess={() => dispatch({type: 'trigger-code-refetch'})}/>
      </div>
    </div>
  )
}
