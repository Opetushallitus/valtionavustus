import React, { useState } from 'react'
import moment from 'moment/moment'

moment.locale('fi')

const formatDate = (date: Date) => {
  return `${moment(date).format('DD.MM.YYYY')} klo ${moment(date).format('HH.mm')}`
}

export interface Message {
  id: number
  date: Date
  virkailija: string
  sender: string
  subject: string
  message: string
  receivers: string[]
}

interface Props {
  messages: Message[]
}

export default function ViestiLista(props: Props) {
  const messages = props.messages.map((message) => {
    const [isOpen, setOpen] = useState(false)
    return (
      <div key={message.id} className={'viestiListaItem'}>
        <div className={'viestiListaRow'}>
          <EnvelopeIcon />
          <div className={'rowDate'}>{formatDate(message.date)}</div>
          <div className={'rowVirkailija'}>{message.virkailija}</div>
          <div className={'rowOpenCloseIcon'} onClick={() => setOpen(!isOpen)}>
            <CloseIcon />
          </div>
        </div>
        {isOpen && <ViestiDetails message={message} />}
      </div>
    )
  })
  return <>{messages}</>
}

function ViestiDetails(props: { message: Message }) {
  const message = props.message
  return (
    <div className={'messageDetails'}>
      <div className={'detailRow'}>
        <div className={'label'}>Lähettäjä</div>
        <div className={'item'}>{message.sender}</div>
      </div>
      <div className={'detailRow'}>
        <div className={'label'}>Vastaanottajat</div>
        <div className={'item'}>{message.receivers.join(', ')}</div>
      </div>
      <div className={'detailRow'}>
        <div className={'label'}>Aihe</div>
        <div className={'item'}>{message.subject}</div>
      </div>
      <div className={'rowMessage'}>{message.message}</div>
    </div>
  )
}

const EnvelopeIcon = () => (
  <svg
    className={'rowIcon'}
    width="19"
    height="15"
    viewBox="0 0 19 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.1687 2.08762L17.442 1.36084L10.7097 8.09308C9.86819 8.93462 8.45289 8.93462 7.61136 8.09308L0.87912 1.39909L0.152344 2.12587L5.16327 7.1368L0.152344 12.1477L0.87912 12.8745L5.89005 7.86357L6.88459 8.85811C7.49661 9.47013 8.29989 9.8144 9.14142 9.8144C9.98295 9.8144 10.7862 9.47013 11.3982 8.85811L12.3928 7.86357L17.4037 12.8745L18.1305 12.1477L13.1196 7.1368L18.1687 2.08762Z"
      fill="#159ECB"
    />
    <path
      d="M16.753 14.1753H1.64367C0.763887 14.1753 0.0371094 13.4485 0.0371094 12.5687V1.78185C0.0371094 0.902068 0.763887 0.175293 1.64367 0.175293H16.753C17.6327 0.175293 18.3595 0.902068 18.3595 1.78185V12.5687C18.3595 13.4485 17.6327 14.1753 16.753 14.1753ZM1.60542 1.20808C1.2994 1.20808 1.0699 1.43758 1.0699 1.7436V12.5305C1.0699 12.8365 1.2994 13.066 1.60542 13.066H16.7147C17.0207 13.066 17.2502 12.8365 17.2502 12.5305V1.7436C17.2502 1.43758 17.0207 1.20808 16.7147 1.20808H1.60542Z"
      fill="#159ECB"
    />
  </svg>
)

const CloseIcon = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.69961 0.100098L0.599609 1.2001L5.29961 5.9001L9.99961 1.2001L8.89961 0.100099L5.29961 3.6001L1.69961 0.100098Z"
      fill="#00516D"
    />
  </svg>
)
