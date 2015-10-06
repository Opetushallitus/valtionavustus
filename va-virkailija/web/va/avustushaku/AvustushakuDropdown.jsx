import React from 'react'
import _ from 'lodash'

import AvustushakuSelector from './AvustushakuSelector.jsx'

import ReactWidgets from 'react-widgets'

export default class AvustushakuDropdown extends AvustushakuSelector {
  render() {
    const avustushaku = this.props.avustushaku
    const avustushakuList = this.props.avustushakuList
    const avustushakuToText = (avustushaku) => {
      console.log("Avustushaku", avustushaku)
      const name = _.get(avustushaku, 'content.name.fi', "")
      const date = _.get(avustushaku, 'content.name.fi', "")
      return name
    }
    return <ReactWidgets.DropdownList valueField="id"
                                      textField={avustushakuToText}
                                      data={avustushakuList}
                                      defaultValue={avustushaku}
                                      caseSensitive={false}
                                      minLength={3}
                                      filter='contains' />
  }
}
