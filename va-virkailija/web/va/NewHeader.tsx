import React from 'react'

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
  saveStatus: HeaderSaveStatus
}

type HeaderProps = {
  environment: EnvironmentApiResponse
  activeTab: string
  userInfo: UserInfo
}

type HeaderContainerProps = NotificationProps & HeaderProps

export const HeaderContainer = ({ activeTab, environment, userInfo, saveStatus }: HeaderContainerProps) => {
  const isScrollingUp = useScrollingUp()
  return (
    <>
      <div key={`header-${isScrollingUp}`} className={`${styles.headerContainer} ${isScrollingUp ? styles.stickyHeader : ''}`}>
        <Header activeTab={activeTab} environment={environment} userInfo={userInfo} />
      </div>
      <Notification saveStatus={saveStatus} />
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

const Notification = ({ saveStatus }: NotificationProps) => {
  return (
    <div style={{ position: 'absolute', top: '48px', right: 0 }}>
      {JSON.stringify(saveStatus)}
    </div>
  )
}
