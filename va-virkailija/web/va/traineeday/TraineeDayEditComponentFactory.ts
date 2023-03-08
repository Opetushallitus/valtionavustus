import ComponentFactory from 'soresu-form/web/form/ComponentFactory'
import TraineeDayEditCalculator from './TraineeDayEditCalculator'
import { FieldOnChangePropertyMapper } from 'soresu-form/web/form/component/PropertyMapper'
import TraineeDayCalculatorSummary from './TraineeDayCalculatorSummary'

export default class TraineeDayEditComponentFactory extends ComponentFactory {
  constructor() {
    super({
      fieldTypeMapping: {
        vaTraineeDayCalculator: TraineeDayEditCalculator,
        vaTraineeDayCalculatorSummary: TraineeDayCalculatorSummary,
      },
      fieldPropertyMapperMapping: {
        vaTraineeDayCalculator: FieldOnChangePropertyMapper,
      },
    })
  }
}
