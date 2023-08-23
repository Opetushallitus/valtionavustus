import React, { useState } from 'react'
import moment from 'moment/moment'

moment.locale('fi')

const formatDate = (date: string) => {
  return `${moment(date).format('DD.MM.YYYY')} klo ${moment(date).format('HH.mm')}`
}

export interface Message {
  id: number
  date: string
  virkailija: string
  sender: string
  subject: string
  message: string
  receivers: string[]
}

interface Props {
  messages: Message[]
  heading?: string
}

type OpenedMessagesState = Record<number, boolean>

export default function ViestiLista(props: Props) {
  const [openedMessages, setOpenedMessages] = useState<OpenedMessagesState>({})
  const messages = props.messages.map((message, idx) => {
    return (
      <ViestiListaRow
        key={message.id}
        icon="envelope"
        date={message.date}
        dataTestId={`open-email-${idx}`}
        virkailija={message.virkailija}
        heading={props.heading}
        onClick={() =>
          setOpenedMessages({ ...openedMessages, [message.id]: !openedMessages[message.id] })
        }
      >
        {openedMessages[message.id] && <ViestiDetails message={message} />}
      </ViestiListaRow>
    )
  })
  return <>{messages}</>
}

export function ViestiDetails(props: { message: Message }) {
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

interface ViestilistaRowProps {
  date: string
  virkailija: string
  heading?: string
  onClick?: () => void
  icon: 'done' | 'envelope'
  dataTestId?: string
  children?: React.ReactNode
}

export function ViestiListaRow({
  date,
  virkailija,
  heading,
  onClick,
  icon,
  dataTestId,
  children,
}: ViestilistaRowProps) {
  return (
    <div className={'viestiListaItem'}>
      <div className={'viestiListaRow'} role="button" onClick={onClick} data-test-id={dataTestId}>
        {icon === 'envelope' ? <EnvelopeIcon /> : <DoneIcon />}
        <div className={'rowDate'}>{formatDate(date)}</div>
        <div className={'rowVirkailija'}>{virkailija}</div>
        {heading ? <div className={'rowHeading'}>{heading}</div> : <div></div>}
        <div className={'rowOpenCloseIcon'}>
          <CloseIcon />
        </div>
      </div>
      {children}
    </div>
  )
}

const EnvelopeIcon = () => (
  <svg
    className={'rowIcon'}
    width="19"
    height="100%"
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

const DoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 16 16" fill="none">
    <g transform="translate(-4 -4)">
      <path
        d="M12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20ZM15.5312 10.5312L11.5312 14.5312C11.2375 14.825 10.7625 14.825 10.4719 14.5312L8.47188 12.5312C8.17813 12.2375 8.17813 11.7625 8.47188 11.4719C8.76562 11.1813 9.24062 11.1781 9.53125 11.4719L11 12.9406L14.4688 9.46875C14.7625 9.175 15.2375 9.175 15.5281 9.46875C15.8187 9.7625 15.8219 10.2375 15.5281 10.5281L15.5312 10.5312Z"
        fill="#159ECB"
      />
    </g>
  </svg>
)
