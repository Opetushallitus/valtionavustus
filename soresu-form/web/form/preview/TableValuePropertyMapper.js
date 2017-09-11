import _ from 'lodash'

import TableFieldPropertyMapper from '../component/TableFieldPropertyMapper'

export default class TableValuePropertyMapper {
  static map(props) {
    return TableFieldPropertyMapper.map(_.assign({}, props, {disabled: true}))
  }
}
