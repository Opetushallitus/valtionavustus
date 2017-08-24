import ComponentFactory from 'soresu-form/web/form/ComponentFactory.jsx'
import TraineeDayEditCalculator from './TraineeDayEditCalculator.jsx'
import {FieldOnChangePropertyMapper} from 'soresu-form/web/form/component/PropertyMapper'
import TraineeDayCalculatorSummary from './TraineeDayCalculatorSummary.jsx'

export default class TraineeDayEditComponentFactory extends ComponentFactory {
  constructor() {
    super({
      fieldTypeMapping: {
        vaTraineeDayCalculator: TraineeDayEditCalculator,
        vaTraineeDayCalculatorSummary: TraineeDayCalculatorSummary
      },
      fieldPropertyMapperMapping: {
        vaTraineeDayCalculator: FieldOnChangePropertyMapper
      }
    })
  }
}
