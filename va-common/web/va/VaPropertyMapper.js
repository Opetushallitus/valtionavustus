import React from 'react'
import _ from 'lodash'

import {
  DefaultPropertyMapper,
  MultipleOptionFieldOnChangePropertyMapper,
  TextFieldPropertyMapper
} from 'soresu-form/web/form/component/PropertyMapper.js'

export class VaFocusAreasPropertyMapper {
  static map(props) {
    const avustushaku = props.customProps.avustushaku
    const focusAreas = avustushaku.content['focus-areas']
    var index = 0
    const options = _.map(focusAreas.items, item => {
      const value = 'focus-area-' + index
      index++
      return {value: value,
        label: item}
    })
    const commonProps = MultipleOptionFieldOnChangePropertyMapper.map(props)
    const extendedProps = _.extend(commonProps, {options: options})
    if(!extendedProps.field.label) {
      extendedProps.field.label = focusAreas.label
    }
    return extendedProps
  }
}

export class BudgetSummaryPropertyMapper {
  static map(props) {
    return _.assign({}, props, {showSelfFinancingField: true})
  }
}

export class SelfFinancingPropertyMapper {
  static map(props) {
    const mapped = TextFieldPropertyMapper.map(props)
    mapped.renderingParameters = _.assign({}, mapped.renderingParameters, {hideLabels: true})
    return mapped
  }
}
