import React, { Component } from 'react'
import HttpUtil from 'va-common/web/HttpUtil.js'

const initialState = {open:false,comment:''}

export default class EditStatus extends Component {

  constructor(props){
    super(props)
    this.state = initialState
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.setState(initialState)
    }
  }

  render() {
    const {avustushaku, hakemus, allowEditing,status} = this.props
    const avustushakuId = avustushaku.id
    const cancelled = status=='cancelled'
    const onOpen = () =>{
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
      HttpUtil.post(url, request).then((res)=> {
        this.setState({submitting: false, submitted: true})
        if(!cancelled){
          window.location.href = editUrl
        }
        }
      )
    }


    const onStatusCommentChange = (event) =>{
      this.setState({comment:event.target.value})
    }

    if(!allowEditing){
      return null
    }

    if(hakemus.status=='officer_edit' && status=='officer_edit'){
      return (<a href={editUrl} target="_blank">Siirry muokkaamaan</a>)
    }

    return (
      <div className="value-edit">
        {open &&
          <div>
            <textarea onChange={onStatusCommentChange} placeholder="Kommentti"></textarea>
            <button className={cancelled ? "btn-danger" : ""} onClick={onSubmit} disabled={this.state.submitting}>{cancelled ? 'Peruuta hakemus' : 'Siirry muokkaamaan'}</button>
            {this.state.submitted && <span>{cancelled ? 'Hakemus peruutettu' : 'Tila muutettu'}</span>}
          </div>
        }
        {!open && <button className={cancelled ? "btn-danger" : ""} onClick={onOpen}>{cancelled ? 'Peruuta hakemus' : 'Muokkaa hakemusta'}</button>}
      </div>
    )
  }
}