import React, { useEffect, useState } from 'react'

import NameFormatter from 'soresu-form/web/va/util/NameFormatter'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

import { UserInfo } from "./types"
import styles from './NewHeader.module.less'
import useScrollingUp from './useScrollingUp'

interface HeaderSaveStatus {
  saveInProgress: boolean
  saveTime: Date | null
  serverError: string
}

type NotificationProps = {
  notification: string
  notificationIcon: () => JSX.Element
  error?: boolean
}

type HeaderProps = {
  environment: EnvironmentApiResponse
  activeTab: string
  userInfo: UserInfo
}

type HeaderContainerProps = HeaderProps & {
  saveStatus: HeaderSaveStatus
}

export const HeaderContainer = ({ activeTab, environment, userInfo, saveStatus }: HeaderContainerProps) => {
  const isScrollingUp = useScrollingUp()
  const [notificationContent, setNotificationContent] = useState<NotificationProps | undefined>(getNotificationContent(saveStatus))

  useEffect(() => {
    const content = getNotificationContent(saveStatus)
    setNotificationContent(content)
    if (content && !saveStatus.saveInProgress) {
      setTimeout(() => setNotificationContent(undefined), 5000)
    }
  }, [saveStatus.saveInProgress])

  return (
    <>
      <div key={`header-${isScrollingUp}`} className={isScrollingUp ? styles.stickyHeaderContainer : styles.headerContainer}>
        <Header activeTab={activeTab} environment={environment} userInfo={userInfo} />
      </div>
      {notificationContent &&
        <div className={styles.notificationContainer}>
          <Notification {...notificationContent} />
        </div>
      }
    </>
  )
}

const Header = ({ activeTab, environment, userInfo }: HeaderProps) => {
  const isAdmin = userInfo.privileges.includes('va-admin')
  const username = `${NameFormatter.onlyFirstForename(userInfo["first-name"])} ${userInfo["surname"]}`
  return (
    <div className={styles.header}>
      <div className={styles.headerLinks}>
        <img src="/img/logo-176x50@2x.png" width="142" height="40" alt="Opetushallitus / Utbildningsstyrelsen" />
        <a href="/admin/" className={activeTab === 'admin' ? 'activeTab' : undefined}>Hakujen hallinta</a>
        <a href="/" className={activeTab === 'arviointi' ? 'activeTab' : undefined}>Hakemusten arviointi</a>
        {isAdmin && <a href="/admin-ui/va-code-values/" className={activeTab === 'va-code-values' ? 'active-tab' : undefined}>VA-koodienhallinta</a>}
        {isAdmin && <a href="/admin-ui/reports/">VA-pulssi</a>}
        <a href="/admin-ui/search/">Haku</a>
      </div>
      <div className={styles.headerControls}>
        {environment['show-name'] && <div className={styles.environmentName}>{environment.name}</div>}
        <div className={styles.username}>{username}</div>
        <form action="/login/logout" name="logout" method="get">
          <button type="submit" className={styles.logoutButton}>Kirjaudu ulos</button>
        </form>
      </div>
    </div>
  )
}

const Notification = ({ notification, notificationIcon, error }: NotificationProps) => {
  return (
    <div className={styles.notificationWrapper}>
      <div className={error ? styles.notificationError : styles.notification} aria-live="polite">
        <span>{notificationIcon()}</span>
        <span data-test-id="save-status">{notification}</span>
      </div>
    </div>
  )
}

function getNotificationContent(saveStatus: HeaderSaveStatus) {
  const { saveInProgress, saveTime, serverError } = saveStatus
  if (saveInProgress) {
    return { notification: 'Tallennetaan', notificationIcon: saveInProgressIcon }
  } else if (serverError) {
    const notification = serverError === 'validation-error'
      ? 'Jossain kentässä puutteita. Tarkasta arvot.'
      : 'Virhe tallennuksessa. Lataa sivu uudelleen.'
    return { notification, notificationIcon: errorIcon, error: true }
  } else if (saveTime) {
    return { notification: 'Kaikki tiedot tallennettu', notificationIcon: okIcon }
  } else {
    return undefined
  }
}

const okIcon = () =>
  <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.7129 0.679688L4.41602 9.97656L1.12891 6.68945C0.962891 6.55664 0.730469 6.55664 0.564453 6.68945L0.199219 7.08789C0.0332031 7.2207 0.0332031 7.48633 0.199219 7.65234L4.15039 11.6035C4.2832 11.7363 4.54883 11.7363 4.68164 11.6035L14.6426 1.64258C14.8086 1.47656 14.8086 1.21094 14.6426 1.07812L14.2773 0.679688C14.1113 0.546875 13.8789 0.546875 13.7129 0.679688Z" fill="#108046"/>
  </svg>

const errorIcon = () =>
  <svg width="3" height="13" viewBox="0 0 3 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.771 9.083H0.802L0.377 0.361999H2.196L1.771 9.083ZM0.224 11.582C0.224 11.1627 0.326 10.868 0.53 10.698C0.734 10.528 0.983333 10.443 1.278 10.443C1.56133 10.443 1.805 10.528 2.009 10.698C2.22433 10.868 2.332 11.1627 2.332 11.582C2.332 11.99 2.22433 12.2847 2.009 12.466C1.805 12.6473 1.56133 12.738 1.278 12.738C0.983333 12.738 0.734 12.6473 0.53 12.466C0.326 12.2847 0.224 11.99 0.224 11.582Z" fill="#BA3E35"/>
  </svg>

const saveInProgressIcon = () =>
  <svg width="9" height="11" viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.47656 10.832C6.65234 10.9492 6.85742 10.8613 6.94531 10.6855C8.05859 8.51758 8 5.88086 6.76953 3.74219C5.53906 1.63281 3.3125 0.255859 0.851562 0.138672C0.646484 0.109375 0.5 0.285156 0.5 0.490234V0.724609C0.5 0.900391 0.617188 1.04688 0.822266 1.07617C2.93164 1.19336 4.89453 2.36523 5.97852 4.21094C7.0332 6.08594 7.0918 8.37109 6.125 10.2461C6.03711 10.4219 6.0957 10.627 6.27148 10.7148L6.47656 10.832Z" fill="#108046"/>
  </svg>

const closeIcon = () =>
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.4082 6.125L10.8281 2.73828L11.5254 2.04102C11.625 1.94141 11.625 1.77539 11.5254 1.64258L10.7949 0.912109C10.6621 0.8125 10.4961 0.8125 10.3965 0.912109L6.3125 5.0293L2.19531 0.912109C2.0957 0.8125 1.92969 0.8125 1.79688 0.912109L1.06641 1.64258C0.966797 1.77539 0.966797 1.94141 1.06641 2.04102L5.18359 6.125L1.06641 10.2422C0.966797 10.3418 0.966797 10.5078 1.06641 10.6406L1.79688 11.3711C1.92969 11.4707 2.0957 11.4707 2.19531 11.3711L6.3125 7.25391L9.69922 10.6738L10.3965 11.3711C10.4961 11.4707 10.6621 11.4707 10.7949 11.3711L11.5254 10.6406C11.625 10.5078 11.625 10.3418 11.5254 10.2422L7.4082 6.125Z" fill="#1A1919"/>
  </svg>
