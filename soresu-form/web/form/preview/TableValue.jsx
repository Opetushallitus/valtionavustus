import _ from 'lodash'
import React from 'react'
import ClassNames from 'classnames'

import TableFieldUtil from '../component/TableFieldUtil.jsx'
import LocalizedString from '../component/LocalizedString.jsx'

export default class TableValue extends React.Component {
  render() {
    const {
      htmlId,
      rowParams,
      columnParams,
      columnSums,
      cellValues,
      renderingParameters,
      fieldTranslations,
      miscTranslations,
      lang
    } = this.props

    const makeValueCellClassNames = (rowIndex, colIndex) =>
      ClassNames("soresu-table__value-cell soresu-table__value-cell--preview", {
        "soresu-table__value-cell--number": columnParams[colIndex].calculateSum
      })

    const makeValueCell = (cellValue, rowIndex, colIndex) =>
      <td className={makeValueCellClassNames(rowIndex, colIndex)}
          key={`cell-${rowIndex}-${colIndex}`}>
        {cellValue}
      </td>

    const makeCaption = () => {
      if (renderingParameters.hideLabels || !fieldTranslations["label"]) {
        return null
      }

      return (
        <caption className="soresu-table__caption">
          <LocalizedString translations={fieldTranslations}
                           translationKey="label"
                           lang={lang} />
        </caption>
      )
    }

    return TableFieldUtil.makeTable({
      htmlId,
      rowParams,
      columnParams,
      columnSums,
      cellValues,
      miscTranslations,
      lang,
      makeCaption,
      makeValueCell,
      tableClassNames: "soresu-table--preview",
      columnTitleCellClassNames: "soresu-table__column-title-cell--preview",
      rowTitleCellClassNames: "soresu-table__row-title-cell--preview",
      sumCellClassNames: "soresu-table__sum-cell--preview"
    })
  }
}
