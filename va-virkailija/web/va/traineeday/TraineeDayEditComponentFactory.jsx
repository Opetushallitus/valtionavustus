import ComponentFactory from 'soresu-form/web/form/ComponentFactory'
import VaTraineeDayCalculator from './TraineeDayEditCalculator.jsx'
import {FieldOnChangePropertyMapper} from 'soresu-form/web/form/component/PropertyMapper.js'
import TraineeDayCalculatorSummary from './TraineeDayCalculatorSummary.jsx'

export default class TraineeDayEditComponentFactory extends ComponentFactory {
  constructor() {
    super({
      fieldTypeMapping: {
        vaTraineeDayCalculator: VaTraineeDayCalculator,
        vaTraineeDayCalculatorSummary: TraineeDayCalculatorSummary
      },
      fieldPropertyMapperMapping: {
        vaTraineeDayCalculator: FieldOnChangePropertyMapper
      }
    })
  }
}
