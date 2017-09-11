import _ from 'lodash'
import React from 'react'
import ClassNames from 'classnames'

import TableFieldUtil from './TableFieldUtil.jsx'
import TableValidator from '../TableValidator'
import HelpTooltip from './HelpTooltip.jsx'
import LocalizedString from './LocalizedString.jsx'

export default class TableField extends React.Component {
  componentDidMount() {
    const {field, cellValues, controller} = this.props
    controller.componentDidMount(field, cellValues)
  }

  render() {
    const {
      htmlId,
      cellOnChange,
      cellOnBlur,
      rowOnRemove,
      rowParams,
      columnParams,
      columnSums,
      cellValues,
      cellsWithErrors,
      hasTableRequiredError,
      disabled,
      required,
      renderingParameters,
      fieldTranslations,
      miscTranslations,
      lang
    } = this.props

    const isGrowingTable = _.isEmpty(rowParams)
    const numRows = cellValues.length
    const lastColIndex = columnParams.length - 1

    const makeInputOnBlur = (rowIndex, colIndex) => event => {
      event.stopPropagation()
      cellOnBlur(event.currentTarget.value, rowIndex, colIndex)
    }

    const makeInputOnChange = (rowIndex, colIndex) => event => {
      event.stopPropagation()
      cellOnChange(event.currentTarget.value, rowIndex, colIndex)
    }

    const makeRowOnRemove = rowIndex => event => {
      event.stopPropagation()
      rowOnRemove(rowIndex)
    }

    const makeTableClassNames = () =>
      ClassNames({
        "soresu-table--error": hasTableRequiredError,
        "soresu-table--disabled": disabled
      })

    const makeValueCellClassNames = (rowIndex, colIndex) =>
      ClassNames("soresu-table__value-cell", {
        "soresu-table__value-cell--number": columnParams[colIndex].calculateSum,
        "soresu-table__value-cell--placeholder": rowIndex === numRows
      })

    const makeHelpTooltip = () => {
      const content = fieldTranslations.helpText
      return content
        ? <HelpTooltip content={content} lang={lang}/>
        : null
    }

    const makeCaption = () => {
      if (renderingParameters.hideLabels || !fieldTranslations["label"]) {
        return null
      }

      return (
        <caption className="soresu-table__caption">
          <LocalizedString className={required ? "required" : null}
                           translations={fieldTranslations}
                           translationKey="label"
                           lang={lang} />
          {makeHelpTooltip()}
        </caption>
      )
    }

    const makeValueCell = (cellValue, rowIndex, colIndex) => {
      const maxLength = columnParams[colIndex].maxlength
      const size = !maxLength || maxLength > 20 ? 20 : maxLength

      return (
        <td className={makeValueCellClassNames(rowIndex, colIndex)}
            key={`cell-${rowIndex}-${colIndex}`}>
          <div className="soresu-table__cell-positioner">
            <input type="text"
                   size={size}
                   maxLength={maxLength}
                   className={makeValueCellInputClassNames(cellsWithErrors[TableValidator.cellErrorIdFor(rowIndex, colIndex)])}
                   value={cellValue}
                   disabled={disabled}
                   onBlur={makeInputOnBlur(rowIndex, colIndex)}
                   onChange={makeInputOnChange(rowIndex, colIndex)}
                   />
            {isGrowingTable && colIndex === lastColIndex && rowIndex < numRows && (
              <button type="button"
                      className="soresu-table__remove-row-button soresu-remove"
                      tabIndex="-1"
                      onClick={makeRowOnRemove(rowIndex)}
                      />
            )}
          </div>
        </td>
      )
    }

    const cells = isGrowingTable
      ? cellValues.concat([_.fill(Array(columnParams.length), "")])
      : cellValues

    return TableFieldUtil.makeTable({
      htmlId,
      rowParams,
      columnParams,
      columnSums,
      cellValues: cells,
      fieldTranslations,
      miscTranslations,
      lang,
      makeCaption,
      makeValueCell,
      tableClassNames: makeTableClassNames()
    })
  }
}

const makeValueCellInputClassNames = cellHasError =>
  ClassNames("soresu-table__value-cell-input", {
    "soresu-table__value-cell-input--error": cellHasError
  })
