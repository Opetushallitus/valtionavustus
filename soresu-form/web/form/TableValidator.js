import _ from 'lodash'
import TableFieldUtil from './component/TableFieldUtil.jsx'
import { representsDecimal, representsInteger } from '../MathUtil'

export default class TableValidator {
  static validateTable(field, values) {
    const numRows = values.length
    const rowParams = _.get(field, 'params.rows', [])
    const columnParams = _.get(field, 'params.columns', [])
    const numColumns = columnParams.length

    let countMissingValues = 0
    let countInvalidValues = 0

    const cellsWithErrors = {}

    for (let rowIndex = 0; rowIndex < numRows; rowIndex += 1) {
      const valueRow = values[rowIndex]
      const isRowRequired = TableFieldUtil.parseRequiredParam(
        _.get(rowParams, [rowIndex, 'required'])
      )

      for (let colIndex = 0; colIndex < numColumns; colIndex += 1) {
        const cellValue = valueRow[colIndex]
        const isColumnRequired = TableFieldUtil.parseRequiredParam(columnParams[colIndex].required)
        const isCellRequired = isRowRequired && isColumnRequired
        const isCellEmpty = isCellEmptyOrWs(cellValue)

        if (isCellRequired && isCellEmpty) {
          countMissingValues += 1
          cellsWithErrors[TableValidator.cellErrorIdFor(rowIndex, colIndex)] = true
        } else if (
          !isCellEmpty &&
          !isCellValueValidType(columnParams[colIndex].valueType, cellValue)
        ) {
          countInvalidValues += 1
          cellsWithErrors[TableValidator.cellErrorIdFor(rowIndex, colIndex)] = true
        }
      }
    }

    const errors = []

    if (countMissingValues) {
      errors.push({
        error: countMissingValues > 1 ? 'table-misses-many-values' : 'table-misses-one-value',
      })
    }

    if (countInvalidValues) {
      errors.push({
        error:
          countInvalidValues > 1 ? 'table-has-many-invalid-values' : 'table-has-one-invalid-value',
      })
    }

    if (errors.length) {
      errors[0].cellsWithErrors = cellsWithErrors
    }

    return errors
  }

  static cellErrorIdFor(rowIndex, colIndex) {
    return `${rowIndex};${colIndex}`
  }
}

const isCellEmptyOrWs = (value) => !_.trim(value).length

const isCellValueValidType = (type, value) => {
  switch (type) {
    case 'integer':
      return representsInteger(value)
    case 'decimal':
      return representsDecimal(value)
    default:
      return true
  }
}
