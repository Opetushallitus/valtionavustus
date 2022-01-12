import React, { Component } from 'react'
import _ from 'lodash'

import DropdownList from 'react-widgets/DropdownList'
import moment from 'moment-timezone'
import { fiShortFormat } from 'soresu-form/web/va/i18n/dateformat'

import './avustushaku-dropdown.less'

export default class AvustushakuDropdown extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const avustushakuList = this.props.avustushakuList
    const avustushakuToText = (avustushaku) => {
      const name = _.get(avustushaku, 'content.name.fi', "")
      const date = moment(_.get(avustushaku, 'content.duration.start', "")).tz('Europe/Helsinki').format(fiShortFormat)
      return name + " (" + date + ")"
    }
    const onChange = (value) => {
      location.path = "/avustushaku/" + value.id
      window.location.href = "/avustushaku/" + value.id + "/" + location.search
    }
    const messages = {
      filterPlaceholder: '',
      emptyList: 'Ei avustushakuja',
      emptyFilter: 'Ei tuloksia'
    }
    const scrollListToTopForIE = opening => {
      if (opening) {
        setTimeout(() => {
          if (document.getElementById('rw_1_input')) {
            document.getElementById('rw_1_input').scrollTop = 0
          }
        }, 100)
      }
    }

    return <div id="avustushaku-dropdown">
             <DropdownList dataKey="id"
                           containerClassName="dropdown-list"
                           textField={avustushakuToText}
                           data={avustushakuList}
                           defaultValue={avustushaku}
                           renderValue={AvustushakuEntry}
                           filter='contains'
                           onChange={onChange}
                           messages={messages}
                           onToggle={scrollListToTopForIE}/>
           </div>
  }
}

function AvustushakuEntry({ item }) {
  const name = item.content.name.fi
  const date = moment(item.content.duration.start).tz('Europe/Helsinki').format(fiShortFormat)
  return (
    <span>
      {name}&nbsp;({date})
     </span>
  )
}
