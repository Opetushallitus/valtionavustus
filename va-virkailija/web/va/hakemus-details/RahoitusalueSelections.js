import _ from 'lodash'

export default class RahoitusalueSelections {
  static validateRahoitusalueSelection(selectedRahoitusalue, availableRahoitusalueet) {
    const found = _.find(availableRahoitusalueet, r => r.rahoitusalue === selectedRahoitusalue)

    return found ? selectedRahoitusalue : null
  }

  static validateTalousarviotiliSelection({selectedTalousarviotili, selectedRahoitusalue, availableRahoitusalueet}) {
    const availableTalousarviotilit = RahoitusalueSelections.getAvailableTalousarviotilit(selectedRahoitusalue, availableRahoitusalueet)

    const validatedTalousarviotiliSelection = getSelectedTalousarviotili(
      selectedRahoitusalue,
      selectedTalousarviotili,
      availableTalousarviotilit)

    return validatedTalousarviotiliSelection
  }

  static getAvailableTalousarviotilit(selectedRahoitusalue, availableRahoitusalueet) {
    if (!selectedRahoitusalue) {
      return []
    }

    const found = _.find(availableRahoitusalueet, r => r.rahoitusalue === selectedRahoitusalue)

    if (!found) {
      return []
    }

    return found.talousarviotilit
  }
}

const getSelectedTalousarviotili = (selectedRahoitusalue, selectedTalousarviotili, availableTalousarviotilit) => {
  if (!selectedRahoitusalue) {
    return null
  }

  if (availableTalousarviotilit.length === 1) {
    return availableTalousarviotilit[0]
  }

  return _.contains(availableTalousarviotilit, selectedTalousarviotili) ? selectedTalousarviotili : null
}
