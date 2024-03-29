import React, { ChangeEvent } from 'react'
import _ from 'lodash'

import BasicFieldComponent, {
  BasicFieldComponentProps,
} from 'soresu-form/web/form/component/BasicFieldComponent'
import RadioButton from 'soresu-form/web/form/component/RadioButton'
import BasicTextField from 'soresu-form/web/form/component/BasicTextField'
import { parseDecimal } from '../MathUtil'
import Translator from 'soresu-form/web/form/Translator'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

import VaTraineeDayUtil from './VaTraineeDayUtil'

const formatFloatString = (stringValue: string) => {
  const sanitizedString = stringValue.replace('.', ',').replace(/[^\d,]/g, '')
  if (sanitizedString.indexOf(',') < 0 || sanitizedString.endsWith(',')) {
    return sanitizedString
  }
  const floatValue = parseDecimal(sanitizedString)
  return VaTraineeDayUtil.formatFloat(floatValue)
}

const formatIntString = (stringValue: string) => {
  if (stringValue === '') {
    return stringValue
  }
  const intValue = parseInt(stringValue, 10)
  return intValue ? intValue.toString() : '0'
}

interface VaTraineeDayCalculatorProps extends BasicFieldComponentProps {}

// Koulutettavapäivälaskuri in finnish
export default class VaTraineeDayCalculator extends BasicFieldComponent<VaTraineeDayCalculatorProps> {
  translator: Translator
  static subfieldSpecFor(fieldId: string, type: string) {
    switch (type) {
      case 'scope-type':
        return { id: fieldId + '.scope-type', fieldType: 'radioButton' }
      case 'scope':
        return { id: fieldId + '.scope', fieldType: 'textField' }
      case 'person-count':
        return { id: fieldId + '.person-count', fieldType: 'textField' }
      case 'total':
        return { id: fieldId + '.total', fieldType: 'textField' }
      default:
        throw new Error('unknown type: ' + type)
    }
  }

  static emptySubfieldsFor(fieldId: string) {
    return [
      { key: fieldId + '.scope-type', value: 'op', fieldType: 'radioButton' },
      { key: fieldId + '.scope', value: '0', fieldType: 'textField' },
      { key: fieldId + '.person-count', value: '0', fieldType: 'textField' },
      { key: fieldId + '.total', value: '0', fieldType: 'textField' },
    ]
  }

  constructor(props: VaTraineeDayCalculatorProps) {
    super(props)
    this.translator = new Translator(props.translations.form['trainee-day-calculator'])
  }

  static validateTotal(field: any, value: any) {
    _.forEach(value, (answer: any) => {
      if (answer.key && !_.startsWith(answer.key, field.id)) {
        const subType = answer.key.substr(answer.key.lastIndexOf('.') + 1)
        answer.key = field.id + '.' + subType
      }
    })
    const total = parseDecimal(VaTraineeDayUtil.readSubfieldValue(value, field.id, 'total'))
    return total > 0 ? undefined : { error: 'negative-trayneeday-total' }
  }

  static onChange(subfield: any, props: any, valueHolder: any, field: any) {
    return (event: ChangeEvent<any>) => {
      let value = event.target.value
      let scopeValue = VaTraineeDayUtil.readSubfieldValue(valueHolder.value, field.id, 'scope')
      let personCountValue = VaTraineeDayUtil.readSubfieldValue(
        valueHolder.value,
        field.id,
        'person-count'
      )
      if (event.target.id.endsWith('scope')) {
        value = formatFloatString(value)
        scopeValue = value
      }
      if (event.target.id.endsWith('person-count')) {
        value = formatIntString(value)
        personCountValue = value
      }
      const fieldUpdate = {
        id: subfield.id,
        field: subfield,
        value: value,
      }
      InputValueStorage.writeValue({}, valueHolder, fieldUpdate)
      const totalFormatted = VaTraineeDayUtil.composeTotal(
        scopeValue,
        personCountValue,
        VaTraineeDayUtil.readSubfieldValue(valueHolder.value, field.id, 'scope-type')
      )
      const totalUpdate = {
        id: field.id + '.' + 'total',
        field: VaTraineeDayCalculator.subfieldSpecFor(field.id, 'total'),
        value: totalFormatted,
      }
      InputValueStorage.writeValue({}, valueHolder, totalUpdate)
      props.onChange({ target: { value: valueHolder.value } })
    }
  }

  render() {
    const props = this.props
    const htmlId = props.htmlId
    const field = props.field
    const valueHolder = {
      value: this.props.value
        ? this.props.value
        : VaTraineeDayCalculator.emptySubfieldsFor(field.id),
    }
    const scopeTypeOptions = [
      {
        value: 'op',
        label: {
          fi: this.translator.translate('op', 'fi'),
          sv: this.translator.translate('op', 'sv'),
        },
      },
      {
        value: 'kp',
        label: {
          fi: this.translator.translate('kp', 'fi'),
          sv: this.translator.translate('kp', 'sv'),
        },
      },
    ]

    const onChange = (subfield: any) => {
      return VaTraineeDayCalculator.onChange(subfield, props, valueHolder, field)
    }

    const totalClassStr = this.resolveClassName('total')
    const scopeStr = VaTraineeDayUtil.readSubfieldValue(valueHolder.value, field.id, 'scope')
    const scopeIsValid = parseDecimal(scopeStr) > 0
    const personCountStr = VaTraineeDayUtil.readSubfieldValue(
      valueHolder.value,
      field.id,
      'person-count'
    )
    const personCountIsValid = parseInt(personCountStr, 10) > 0
    const totalStr = VaTraineeDayUtil.readSubfieldValue(valueHolder.value, field.id, 'total')

    return (
      <div id={htmlId} className="va-trainee-day-calculator">
        <table>
          <thead>
            <tr>
              <th>{this.translator.translate('scope-type', this.props.lang)}</th>
              <th>{this.translator.translate('scope', this.props.lang)}</th>
              <th>{this.translator.translate('person-count', this.props.lang)}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <RadioButton
                  field={field}
                  htmlId={htmlId + '.scope-type'}
                  options={scopeTypeOptions}
                  disabled={props.disabled}
                  onChange={onChange(
                    VaTraineeDayCalculator.subfieldSpecFor(field.id, 'scope-type')
                  )}
                  value={VaTraineeDayUtil.readSubfieldValue(
                    valueHolder.value,
                    field.id,
                    'scope-type'
                  )}
                  translations={{}}
                  lang={this.props.lang}
                  renderingParameters={undefined}
                  translationKey={''}
                  controller={null}
                />
              </td>
              <td>
                <BasicTextField
                  htmlId={htmlId + '.scope'}
                  disabled={props.disabled}
                  onChange={onChange(VaTraineeDayCalculator.subfieldSpecFor(field.id, 'scope'))}
                  value={scopeStr}
                  translations={{}}
                  hasError={props.hasError && !scopeIsValid}
                  size="extra-extra-small"
                  lang={this.props.lang}
                  field={field}
                  controller={null}
                  translationKey={''}
                  renderingParameters={{}}
                />
              </td>
              <td>
                <BasicTextField
                  htmlId={htmlId + '.person-count'}
                  disabled={props.disabled}
                  onChange={onChange(
                    VaTraineeDayCalculator.subfieldSpecFor(field.id, 'person-count')
                  )}
                  value={personCountStr}
                  translations={{}}
                  hasError={props.hasError && !personCountIsValid}
                  size="extra-extra-small"
                  lang={this.props.lang}
                  field={field}
                  translationKey={''}
                  renderingParameters={{}}
                />
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>
                {this.label(totalClassStr)}: {totalStr}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }
}

interface VaTraineeDayTotalCalculatorProps {
  answersObject: any
  translations: any
  htmlId: any
  lang: any
}

export class VaTraineeDayTotalCalculator extends React.Component<VaTraineeDayTotalCalculatorProps> {
  translator: Translator
  constructor(props: VaTraineeDayTotalCalculatorProps) {
    super(props)
    this.translator = new Translator(props.translations.form['trainee-day-calculator'])
  }

  render() {
    const htmlId = this.props.htmlId
    const calcAnswers = InputValueStorage.readValues(
      this.props.answersObject,
      'vaTraineeDayCalculator'
    )
    const sumPersonCount = VaTraineeDayUtil.sumSubfieldValues(calcAnswers, 'person-count')
    const sumTotalFormatted = VaTraineeDayUtil.formatFloat(
      VaTraineeDayUtil.sumSubfieldValues(calcAnswers, 'total')
    )
    return (
      <div id={htmlId} className="va-trainee-day-calculator-total">
        <p>
          <label className="total">
            {this.translator.translate('person-count-total', this.props.lang)}:
          </label>{' '}
          {sumPersonCount}
        </p>
        <p>
          <label className="total">
            {this.translator.translate('scope-total', this.props.lang)}:
          </label>{' '}
          {sumTotalFormatted}
        </p>
      </div>
    )
  }
}
