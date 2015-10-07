import React from 'react'
import _ from 'lodash'

import { DefaultPropertyMapper, MultipleOptionFieldOnChangePropertyMapper } from 'soresu-form/web/form/component/PropertyMapper.js'

export class VaFocusAreasPropertyMapper extends DefaultPropertyMapper {
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
