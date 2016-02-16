import _ from 'lodash'

export default class Koulutusosiot{

  static values(answers, fieldId){
    const koulutusosiot = _.find(answers,(i)=>i.key=="koulutusosiot")
    const osioIndex = _.findIndex(koulutusosiot.value, (i)=> _.find(i.value,(x)=>x.key == fieldId))
    return koulutusosiot.value[osioIndex].value
  }

  static fieldValue(values,key){
    return _.find(values,(i)=>i.fieldType==key).value
  }

  static nameField(currentKoulutusOsio){
    return Koulutusosiot.fieldValue(currentKoulutusOsio,"nameField")
  }

  static traineeDayCalculator(currentKoulutusOsio){
    return Koulutusosiot.fieldValue(currentKoulutusOsio,"vaTraineeDayCalculator")
  }
}