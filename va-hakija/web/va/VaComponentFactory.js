import React from 'react'
import _ from 'lodash'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory.js'
import CheckboxButton from 'soresu-form/web/form/component/CheckboxButton.jsx'
import MultipleOptionValue from 'soresu-form/web/form/preview/MultipleOptionValue.jsx'
import { DefaultPropertyMapper, MultipleOptionFieldOnChangePropertyMapper } from 'soresu-form/web/form/component/PropertyMapper.js'

import {VaBudgetElement, SummingBudgetElement, BudgetItemElement, BudgetSummaryElement} from 'va-common/web/va/VaBudgetComponents.jsx'
import VaProjectDescription from './VaProjectDescription.jsx'

export default class VaComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": VaBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": BudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement,
      "vaProjectDescription": VaProjectDescription,
      "vaFocusAreas": CheckboxButton
    }
    super(fieldTypeMapping)
  }

  getCustomComponentProperties(state) {
    return { "avustushaku": state.avustushaku }
  }

  createComponent(componentProps) {
    const fieldType = componentProps.fieldType
    if (fieldType === "vaFocusAreas") {
      const vaFocusAreasProps = VaFocusAreasPropertyMapper.map(componentProps)
      if(componentProps.preview) {
        return React.createElement(MultipleOptionValue, vaFocusAreasProps)
      }
      else {
        return super.createComponent(vaFocusAreasProps)
      }
    }
    return super.createComponent(componentProps)
  }
}

class VaFocusAreasPropertyMapper extends DefaultPropertyMapper {
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
