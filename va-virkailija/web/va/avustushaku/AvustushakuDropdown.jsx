import React from 'react'
import _ from 'lodash'

import AvustushakuSelector from './AvustushakuSelector.jsx'

import ReactWidgets from 'react-widgets'

import moment from 'moment-timezone'

export default class AvustushakuDropdown extends AvustushakuSelector {
  render() {
    const avustushaku = this.props.avustushaku
    const avustushakuList = this.props.avustushakuList
    const avustushakuToText = (avustushaku) => {
      const name = _.get(avustushaku, 'content.name.fi', "")
      const date = moment(_.get(avustushaku, 'content.duration.start', "")).tz('Europe/Helsinki').format('D.M.YYYY')
      return name + " (" + date + ")"
    }
    const onChange = (value) => {
      location.path = "/avustushaku/" + value.id
      window.location.href = "/avustushaku/" + value.id
    }
    return <ReactWidgets.DropdownList valueField="id"
                                      textField={avustushakuToText}
                                      data={avustushakuList}
                                      defaultValue={avustushaku}
                                      valueComponent={AvustushakuEntry}
                                      caseSensitive={false}
                                      minLength={3}
                                      filter='contains'
                                      onChange={onChange} />
  }
}

class AvustushakuEntry extends React.Component {
  render() {
    const name = this.props.item.content.name.fi
    const date = moment(this.props.item.content.duration.start).tz('Europe/Helsinki').format('D.M.YYYY')
    return <span>
             {name}&nbsp;(<strong>{date}</strong>)
           </span>
  }
}
