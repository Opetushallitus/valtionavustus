import _ from 'lodash'

import {DefaultPropertyMapper} from './PropertyMapper'
import MathUtil from '../../MathUtil'

export default class TableFieldPropertyMapper {
  static map(props) {
    const {lang, field, disabled, onChange, validationErrors} = props

    const makeRowParams = paramRows =>
      _.map(paramRows, row => _.assign({}, row, {title: row.title[lang]}))

    const makeColumnParams = paramColumns =>
      _.map(paramColumns, col => _.assign({}, col, {title: col.title[lang]}))

    const rowParams = makeRowParams(DefaultPropertyMapper.param(field, "rows", []))
    const columnParams = makeColumnParams(DefaultPropertyMapper.param(field, "columns", []))
    const cellValues = makeCellValues(rowParams.length, columnParams.length, parseSavedValue(_.get(props, "value", [])))
    const isGrowingTable = _.isEmpty(rowParams)
    const columnSums = makeColumnSums(columnParams, cellValues)

    const cellOnChange = disabled ? null : (cellValue, cellRowIndex, cellColIndex) => {
      const newCellValues = isGrowingTable && cellRowIndex === cellValues.length
        ? appendCellRowWithValue(cellValues, columnParams.length, cellValue, cellColIndex)
        : changeCellValue(cellValues, columnParams.length, cellValue, cellRowIndex, cellColIndex)

      onChange(field, newCellValues)
    }

    const cellOnBlur = disabled ? null : (cellValue, cellRowIndex, cellColIndex) => {
      if ((cellRowIndex < cellValues.length && cellValue === cellValues[cellRowIndex][cellColIndex]) ||
          (cellRowIndex === cellValues.length && cellValue === ""))  {
        return  // no change, skip
      }

      cellOnChange(cellValue, cellRowIndex, cellColIndex)
    }

    const rowOnRemove = disabled ? null : rowIndexToRemove => {
      const numRows = cellValues.length
      const newCellValues = []

      for (let rowIndex = 0; rowIndex < numRows; rowIndex += 1) {
        if (rowIndex !== rowIndexToRemove) {
          newCellValues.push(cellValues[rowIndex])
        }
      }

      onChange(field, newCellValues)
    }

    return _.assign({}, props, {
      cellOnChange,
      cellOnBlur,
      rowOnRemove,
      rowParams,
      columnParams,
      columnSums,
      cellValues,
      cellsWithErrors: makeCellsWithErrors(validationErrors),
      hasTableRequiredError: hasTableRequiredError(validationErrors),
      renderingParameters: props.renderingParameters || {},
      required: field.required,
      fieldTranslations: field,
      miscTranslations: props.translations.form["table-field"]
    })
  }
}

const ensureArraySize = (size, fillValue, ary) => {
  const numMissingValues = size - ary.length

  if (numMissingValues == 0) {
    return ary
  } else if (numMissingValues > 0) {
    return ary.concat(_.fill(Array(numMissingValues), fillValue))
  } else {
    return ary.slice(0, size)
  }
}

const parseSavedValue = value =>
  _.isEmpty(value)
    ? []  // ensure empty string or array coerces to empty array
    : value

const makeCellValues = (numFixedRows, numColumns, savedValues) => {
  const rows = numFixedRows > 0
    ? ensureArraySize(numFixedRows, [], savedValues)
    : savedValues

  return _.map(rows, row => ensureArraySize(numColumns, "", row))
}

const makeColumnSums = (columnParams, cellValues) => {
  const sums = {}
  const numColumns = columnParams.length
  const numRows = cellValues.length

  for (let rowIndex = 0; rowIndex < numRows; rowIndex += 1) {
    const cellValueRow = cellValues[rowIndex]

    for (let colIndex = 0; colIndex < numColumns; colIndex += 1) {
      if (columnParams[colIndex].calculateSum) {
        const sum = sums[colIndex] || 0
        sums[colIndex] = sum + (MathUtil.parseDecimal(cellValueRow[colIndex]) || 0)
      }
    }
  }

  return _.mapValues(sums, d => MathUtil.formatDecimal(MathUtil.roundDecimal(d, 1)))
}

const appendCellRowWithValue = (cellValues, numColumns, cellValue, cellColIndex) => {
  const newCellRow = _.fill(Array(numColumns), "")
  newCellRow[cellColIndex] = cellValue
  return cellValues.concat([newCellRow])
}

const changeCellValue = (cellValues, numColumns, cellValue, cellRowIndex, cellColIndex) => {
  const numRows = cellValues.length
  const newCellValues = []

  for (let rowIndex = 0; rowIndex < numRows; rowIndex += 1) {
    const cellValueRow = cellValues[rowIndex]

    if (rowIndex === cellRowIndex) {
      const newCellValueRow = []

      for (let colIndex = 0; colIndex < numColumns; colIndex += 1) {
        const newCellValue = colIndex === cellColIndex ? cellValue : cellValueRow[colIndex]
        newCellValueRow.push(newCellValue)
      }

      newCellValues.push(newCellValueRow)
    } else {
      newCellValues.push(cellValueRow)
    }
  }

  return newCellValues
}

const hasTableRequiredError = validationErrors =>
  _.some(validationErrors, err => err.error === "required")

const makeCellsWithErrors = validationErrors =>
  _.reduce(validationErrors, (acc, err) => _.assign(acc, err.cellsWithErrors || {}), {})
