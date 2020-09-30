import React, { Component } from 'react'
import HttpUtil from 'soresu-form/web/HttpUtil'
import HelpTooltip from '../HelpTooltip.jsx'


export default class EditStatus extends Component {

  constructor(props){
    super(props)
    this.state = EditStatus.initialState(props)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.hakemus.id !== state.currentAvustushakuId) {
      return EditStatus.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    return {
      currentAvustushakuId: props.avustushaku.id,
      open: false,
      comment: ''
    }
  }

  render() {
    const {avustushaku, hakemus, allowEditing,status, helpTexts} = this.props
    const avustushakuId = avustushaku.id
    const cancelled = status === 'cancelled'
    const onOpen = () => {
      this.setState({open:true})
    }

    const open = this.state.open

    const editUrl = `/hakemus-edit/${avustushakuId}/${hakemus["user-key"]}`

    const onSubmit = () => {
      this.setState({submitting: true})
      const url = `/api/avustushaku/${avustushakuId}/hakemus/${hakemus.id}/status`
      const request = {
        "status": status,
        "comment": this.state.comment
      }
      HttpUtil.post(url, request).then(() => {
        this.setState({submitting: false, submitted: true})
        if(!cancelled){
          window.open(editUrl,'_blank')
        }
      })
    }

    const onStatusCommentChange = (event) =>{
      this.setState({comment:event.target.value})
    }

    if(!allowEditing){
      return null
    }

    if (hakemus.status === 'officer_edit' && status === 'officer_edit') {
      return (
        <a href={editUrl}
           target="_blank"
           rel="noopener noreferrer">
          Siirry muokkaamaan
        </a>)
    }

    const tooltip = () => {
      if (cancelled) {
        return <HelpTooltip testId={"tooltip-peruuta-hakemus"} content={helpTexts["hankkeen_sivu__arviointi___peruuta_hakemus"]} direction={"arviointi-slim"} />
      } else {
        return <HelpTooltip testId={"tooltip-muokkaa-hakemusta"} content={helpTexts["hankkeen_sivu__arviointi___muokkaa_hakemusta"]} direction={"arviointi-slim"} />
      }
    }


    return (
      <div className="value-edit">
        {open &&
          <div>
            <textarea onChange={onStatusCommentChange} placeholder="Kommentti"></textarea>
            <span>
              <button className={cancelled ? "btn-danger" : ""} onClick={onSubmit} disabled={this.state.submitting}>{cancelled ? 'Peruuta hakemus' : 'Siirry muokkaamaan'}</button>
              { tooltip() }
            </span>
            {this.state.submitted && <span>{cancelled ? 'Hakemus peruutettu' : 'Tila muutettu'}</span>}
          </div>
        }
        {!open && <span>
          <button className={cancelled ? "btn-danger" : ""} onClick={onOpen}>{cancelled ? 'Peruuta hakemus' : 'Muokkaa hakemusta'}</button>
          { tooltip() }
        </span>
        }
      </div>
    )
  }
}
