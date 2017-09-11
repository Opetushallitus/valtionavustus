import _ from 'lodash'
import React from 'react'
import ClassNames from 'classnames'

import LocalizedString from './LocalizedString.jsx'

export default class TableFieldUtil {
  static makeTable({
    htmlId,
    rowParams,
    columnParams,
    columnSums,
    cellValues,
    miscTranslations,
    lang,
    makeCaption,
    makeValueCell,
    tableClassNames = "",
    columnTitleCellClassNames = "",
    rowTitleCellClassNames = "",
    sumCellClassNames = ""
  }) {
    const isGrowingTable = _.isEmpty(rowParams)
    const usesSumCalculation = _.some(columnParams, col => col.calculateSum)
    const lastColIndex = columnParams.length - 1
    const lastRowIndex = cellValues.length - 1

    const makeTableClassNames = () =>
      ClassNames("soresu-table", tableClassNames, {
        "soresu-table--with-extra-left-space": isGrowingTable && usesSumCalculation
      })

    const makeColumnTitleCellClassNames = col =>
      ClassNames("soresu-table__column-title-cell", columnTitleCellClassNames, {
        "soresu-table__column-title-cell--number": col.calculateSum
      })

    const makeRowTitleCellClassNames = () =>
      ClassNames("soresu-table__row-title-cell", rowTitleCellClassNames)

    const makeSumCellClassNames = col =>
      ClassNames("soresu-table__sum-cell", sumCellClassNames, {
        "soresu-table__sum-cell--number": col.calculateSum
      })

    const makeCornerCell = () =>
      !isGrowingTable || usesSumCalculation
        ? <th rowSpan={isGrowingTable ? cellValues.length + 2 : 1}/>
        : null

    const makeColumnTitleCell = (col, index) =>
      <th className={makeColumnTitleCellClassNames(col)}
          key={"title-" + index}>
        {col.title}
      </th>

    const makeRowTitleCell = index => {
      const row = rowParams[index]
      return row
        ? <th className={makeRowTitleCellClassNames()}>{row.title}</th>
        : null
    }

    const makeColumnSumCell = (col, index) =>
      <td className={makeSumCellClassNames(col)}
          key={"total-sum-" + index}>
        {col.calculateSum ? columnSums[index] : null}
      </td>

    return (
      <table id={htmlId} className={makeTableClassNames()}>
        {makeCaption()}
        <tbody>
          <tr>
            {makeCornerCell()}
            {_.map(columnParams, makeColumnTitleCell)}
          </tr>
          {_.map(cellValues, (cellValueRows, rowIndex) => (
            <tr key={"row-" + rowIndex}>
              {makeRowTitleCell(rowIndex)}
              {_.map(cellValueRows, (cellValue, colIndex) => makeValueCell(cellValue, rowIndex, colIndex))}
            </tr>
          ))}
        </tbody>
        {usesSumCalculation && (
          <tfoot>
            <tr>
              <th className={makeRowTitleCellClassNames()}>
                <LocalizedString translations={miscTranslations} translationKey="sum-title" lang={lang} />
              </th>
              {_.map(columnParams, makeColumnSumCell)}
            </tr>
          </tfoot>
        )}
      </table>
    )
  }
}
