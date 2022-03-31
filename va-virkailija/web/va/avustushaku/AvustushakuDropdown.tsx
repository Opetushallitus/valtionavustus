import DropdownList from 'react-widgets/DropdownList'
import moment from 'moment-timezone'
import { fiShortFormat } from 'soresu-form/web/va/i18n/dateformat'
import {Avustushaku} from "soresu-form/web/va/types";

import styles from './avustushaku-dropdown.module.less'

interface Props {
  avustushaku: Avustushaku
  avustushakuList: Avustushaku[]
}

export default function AvustushakuDropdown({avustushaku, avustushakuList}: Props) {
  // at this time react-widget typings has textField fn parameter as unknown :(
  const avustushakuToText = (avustushaku: unknown) => {
    const {content} = (avustushaku as Avustushaku)
    const name = content.name.fi
    const date = moment(content.duration.start).tz('Europe/Helsinki').format(fiShortFormat)
    return name + " (" + date + ")"
  }
  const onChange = (value: Avustushaku) => {
    window.location.href = "/avustushaku/" + value.id + "/" + location.search
  }
  const messages = {
    filterPlaceholder: '',
    emptyList: 'Ei avustushakuja',
    emptyFilter: 'Ei tuloksia'
  }
  return <div id="avustushaku-dropdown">
           <DropdownList dataKey="id"
                         containerClassName={styles.dropdownList}
                         textField={avustushakuToText}
                         data={avustushakuList}
                         defaultValue={avustushaku}
                         renderValue={AvustushakuEntry}
                         filter='contains'
                         onChange={onChange}
                         messages={messages} />
         </div>
}

function AvustushakuEntry({ item }: {item: Avustushaku, dataKey: unknown, text: string}) {
  const name = item.content.name.fi
  const date = moment(item.content.duration.start).tz('Europe/Helsinki').format(fiShortFormat)
  return (
    <span>
      {name}&nbsp;({date})
     </span>
  )
}
