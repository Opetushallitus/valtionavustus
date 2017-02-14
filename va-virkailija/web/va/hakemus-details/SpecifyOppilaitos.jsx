import React from 'react'

const OppilaitosRow = ({value, allowEditing, onChange, onDelete}) =>{
  const deleteButton = onDelete ? <button type="button" onClick={onDelete}>Poista</button> : null
  return (
    <div>
      <input
             type="text"
             name="oppilaitos"
             size="50"
             maxLength="50"
             value={value}
             disabled={!allowEditing}
             onChange={onChange}
      />
      {deleteButton}
    </div>
  )
}

export default class SpecifyOppilaitos extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const avustushaku = this.props.avustushaku
    if(avustushaku["haku-type"] !== 'yleisavustus') {
      return null
    }
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const currentOppilaitokset = hakemus.arvio ? hakemus.arvio.oppilaitokset.names : []
    const controller = this.props.controller
    const oppilaitosRows = []
    const onOppilaitosChange = function(index) {
      return allowEditing ? (event) => {
            controller.setOppilaitos(hakemus, index, event.target.value)
          } : null
    }
    const onOppilaitosRemove = function(index) {
      return allowEditing ? (event) => {
            controller.removeOppilaitos(hakemus, index)
          } : null
    }
    var oppilaitosIndex = 0
    for (; oppilaitosIndex < currentOppilaitokset.length; oppilaitosIndex++) {
      oppilaitosRows.push(<OppilaitosRow key={"oppilaitos-" + oppilaitosIndex} value={currentOppilaitokset[oppilaitosIndex]} onChange={onOppilaitosChange(oppilaitosIndex)} onDelete={onOppilaitosRemove(oppilaitosIndex)}
                                         allowEditing={allowEditing}/>)
    }
    oppilaitosRows.push(<OppilaitosRow key={"oppilaitos-" + oppilaitosIndex} value="" onChange={onOppilaitosChange(oppilaitosIndex)} allowEditing={allowEditing}/>)

    return (
      <div className="hakemus-arviointi-section">
        <label>Tukea saavat oppilaitokset / toimipisteet:</label>
        {oppilaitosRows}
      </div>
    )
  }
}
