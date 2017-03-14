import React from 'react'
import _ from 'lodash'

import ChooseRahoitusalue from './ChooseRahoitusalue.jsx'
import ChooseTalousarviotili from './ChooseTalousarviotili.jsx'
import RahoitusalueSelections from './RahoitusalueSelections'

export default class ChooseRahoitusalueAndTalousarvioTili extends React.Component {
  constructor(props) {
    super(props)
    this.selectRahoitusalue = this.selectRahoitusalue.bind(this);
    this.selectTalousarviotili = this.selectTalousarviotili.bind(this);
  }

  selectRahoitusalue(selection) {
    if (selection === this.props.hakemus.arvio.rahoitusalue) {
      return
    }

    const selectedTalousarviotili = RahoitusalueSelections.validateTalousarviotiliSelection({
      selectedTalousarviotili: null,
      selectedRahoitusalue:    selection,
      availableRahoitusalueet: this.props.avustushaku.content.rahoitusalueet
    })

    this.props.controller.setHakemusRahoitusalueAndTalousarviotili({
      hakemus:         this.props.hakemus,
      rahoitusalue:    selection,
      talousarviotili: selectedTalousarviotili
    })
  }

  selectTalousarviotili(selection) {
    const hakemus = this.props.hakemus

    if (selection === hakemus.arvio.talousarviotili) {
      return
    }

    this.props.controller.setHakemusRahoitusalueAndTalousarviotili({
      hakemus:         hakemus,
      rahoitusalue:    hakemus.arvio.rahoitusalue,
      talousarviotili: selection
    })
  }

  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const availableRahoitusalueet = this.props.avustushaku.content.rahoitusalueet

    const selectedRahoitusalue = hakemus.arvio.rahoitusalue
    const selectedTalousarviotili = hakemus.arvio.talousarviotili
    const availableTalousarviotilit = RahoitusalueSelections.getAvailableTalousarviotilit(selectedRahoitusalue, availableRahoitusalueet)

    return _.isEmpty(availableRahoitusalueet)
      ? null
      : (
        <div>
          <ChooseRahoitusalue selectedRahoitusalue={selectedRahoitusalue}
                              availableRahoitusalueet={availableRahoitusalueet}
                              allowEditing={allowEditing}
                              onSelection={this.selectRahoitusalue}/>
          <ChooseTalousarviotili selectedTalousarviotili={selectedTalousarviotili}
                                 availableTalousarviotilit={availableTalousarviotilit}
                                 allowEditing={allowEditing}
                                 onSelection={this.selectTalousarviotili}/>
        </div>
        )
  }
}
