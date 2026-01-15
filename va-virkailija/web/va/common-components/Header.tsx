import React, { useEffect, useState } from 'react'

import NameFormatter from 'soresu-form/web/va/util/NameFormatter'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

import { UserInfo } from '../types'
import * as styles from './Header.module.css'
import useScrollingUp from '../useScrollingUp'

export interface HeaderSaveStatus {
  saveInProgress: boolean
  saveTime: Date | string | null
  serverError?: string
  loading?: boolean
  loadError?: string
  sendingMaksatuksetAndTasmaytysraportti?: boolean
  sendingMaksatuksetAndTasmaytysraporttiFailed?: boolean
}

type NotificationStatus = 'ok' | 'error' | 'warning' | 'info'

type NotificationProps = {
  notification: string
  notificationIcon: () => React.JSX.Element
  status: NotificationStatus
}

type HeaderProps = {
  environment: EnvironmentApiResponse
  activeTab: string
  userInfo: UserInfo
  avustushakuId?: number
}

type HeaderContainerProps = HeaderProps & {
  saveStatus?: HeaderSaveStatus
}

export const HeaderContainer = ({
  activeTab,
  environment,
  userInfo,
  saveStatus,
  avustushakuId,
}: HeaderContainerProps) => {
  const isScrollingUp = useScrollingUp()
  const isNotificationWithHeader = isScrollingUp || window.scrollY === 0
  const [notificationContent, setNotificationContent] = useState<NotificationProps | undefined>(
    getNotificationContent(saveStatus)
  )

  useEffect(() => {
    const content = getNotificationContent(saveStatus)
    setNotificationContent(content)
    const timeout = setTimeout(() => {
      const somethingPending = Object.values(saveStatus ?? {}).some((status) => status === true)
      if (!somethingPending) {
        setNotificationContent(undefined)
      }
    }, 5000)

    return () => {
      clearTimeout(timeout)
    }
  }, [
    saveStatus?.saveInProgress,
    saveStatus?.saveTime,
    saveStatus?.serverError,
    saveStatus?.sendingMaksatuksetAndTasmaytysraportti,
    saveStatus?.sendingMaksatuksetAndTasmaytysraporttiFailed,
    saveStatus?.loadError,
    saveStatus?.loading,
  ])

  return (
    <>
      <div
        key={`header-${isScrollingUp}`}
        className={isScrollingUp ? styles.stickyHeaderContainer : styles.headerContainer}
      >
        <Header
          activeTab={activeTab}
          environment={environment}
          userInfo={userInfo}
          avustushakuId={avustushakuId}
        />
      </div>
      {notificationContent && (
        <div
          className={
            isNotificationWithHeader
              ? styles.notificationContainer
              : styles.notificationContainerWithoutHeader
          }
        >
          <Notification {...notificationContent} />
        </div>
      )}
    </>
  )
}

const Header = ({ activeTab, environment, userInfo, avustushakuId }: HeaderProps) => {
  const isAdmin = userInfo.privileges.includes('va-admin')
  const username = `${NameFormatter.onlyFirstForename(userInfo['first-name'])} ${
    userInfo['surname']
  }`
  return (
    <div className={styles.header}>
      <div className={styles.headerLinks}>
        <img
          src="/img/logo-176x50@2x.png"
          width="142"
          height="40"
          alt="Opetushallitus / Utbildningsstyrelsen"
        />
        <a
          href={avustushakuId ? `/admin/haku-editor/?avustushaku=${avustushakuId}` : '/admin/'}
          className={activeTab === 'admin' ? 'activeTab' : undefined}
        >
          Hakujen hallinta
        </a>
        <a
          href={avustushakuId ? `/avustushaku/${avustushakuId}/` : '/'}
          className={activeTab === 'arviointi' ? 'activeTab' : undefined}
        >
          Hakemusten arviointi
        </a>
        {isAdmin && (
          <a
            href="/admin-ui/va-code-values/"
            className={activeTab === 'va-code-values' ? 'activeTab' : undefined}
          >
            VA-koodienhallinta
          </a>
        )}
        <a href="/haku/" className={activeTab === 'search' ? 'activeTab' : undefined}>
          Haku
        </a>
      </div>
      <div className={styles.headerControls}>
        {environment['show-name'] && (
          <div className={styles.environmentName}>{environment.name}</div>
        )}
        <div className={styles.username}>{username}</div>
        <form action="/login/logout" name="logout" method="get">
          <button type="submit" className={styles.logoutButton}>
            Kirjaudu ulos
          </button>
        </form>
      </div>
    </div>
  )
}

const notificationClass: { [k in NotificationStatus]: any } = {
  ok: styles.notification,
  error: styles.notificationError,
  warning: styles.notificationWarning,
  info: styles.notificationInfo,
}

const Notification = ({ notification, notificationIcon, status }: NotificationProps) => {
  return (
    <div className={styles.notificationWrapper}>
      <div className={notificationClass[status]} aria-live="polite">
        <span>{notificationIcon()}</span>
        <span data-test-id="save-status">{notification}</span>
      </div>
    </div>
  )
}

function getNotificationContent(saveStatus?: HeaderSaveStatus): NotificationProps | undefined {
  if (saveStatus?.saveInProgress) {
    return {
      notification: 'Tallennetaan',
      notificationIcon: saveInProgressIcon,
      status: 'ok',
    }
  } else if (saveStatus?.serverError) {
    const notification =
      saveStatus?.serverError === 'validation-error'
        ? 'Jossain kentässä puutteita. Tarkasta arvot.'
        : 'Virhe tallennuksessa. Lataa sivu uudelleen.'
    return { notification, notificationIcon: errorIcon, status: 'error' }
  } else if (saveStatus?.loadError) {
    return {
      notification: 'Virhe tietojen lataamisessa. Yritä uudelleen.',
      notificationIcon: errorIcon,
      status: 'error',
    }
  } else if (saveStatus?.saveTime) {
    return {
      notification: 'Kaikki tiedot tallennettu',
      notificationIcon: okIcon,
      status: 'ok',
    }
  } else if (saveStatus?.loading) {
    return {
      notification: 'Ladataan tietoja',
      notificationIcon: saveInProgressIcon,
      status: 'warning',
    }
  } else if (saveStatus?.sendingMaksatuksetAndTasmaytysraportti) {
    return {
      notification: 'Lähetetään maksatuksia ja täsmäytysraporttia',
      notificationIcon: saveInProgressIcon,
      status: 'ok',
    }
  } else if (saveStatus?.sendingMaksatuksetAndTasmaytysraporttiFailed) {
    return {
      notification: 'Maksatuksien ja täsmäytysraportin lähetys epäonnistui',
      notificationIcon: errorIcon,
      status: 'error',
    }
  } else {
    return undefined
  }
}

const okIcon = () => (
  <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.7129 0.679688L4.41602 9.97656L1.12891 6.68945C0.962891 6.55664 0.730469 6.55664 0.564453 6.68945L0.199219 7.08789C0.0332031 7.2207 0.0332031 7.48633 0.199219 7.65234L4.15039 11.6035C4.2832 11.7363 4.54883 11.7363 4.68164 11.6035L14.6426 1.64258C14.8086 1.47656 14.8086 1.21094 14.6426 1.07812L14.2773 0.679688C14.1113 0.546875 13.8789 0.546875 13.7129 0.679688Z"
      fill="#108046"
    />
  </svg>
)

const errorIcon = () => (
  <svg width="3" height="13" viewBox="0 0 3 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.771 9.083H0.802L0.377 0.361999H2.196L1.771 9.083ZM0.224 11.582C0.224 11.1627 0.326 10.868 0.53 10.698C0.734 10.528 0.983333 10.443 1.278 10.443C1.56133 10.443 1.805 10.528 2.009 10.698C2.22433 10.868 2.332 11.1627 2.332 11.582C2.332 11.99 2.22433 12.2847 2.009 12.466C1.805 12.6473 1.56133 12.738 1.278 12.738C0.983333 12.738 0.734 12.6473 0.53 12.466C0.326 12.2847 0.224 11.99 0.224 11.582Z"
      fill="#BA3E35"
    />
  </svg>
)

const saveInProgressIcon = () => (
  <svg
    className={styles.spinnerClass}
    width="14"
    height="14"
    viewBox="0 0 66 66"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      className={styles.spinnerPath}
      fill="none"
      strokeWidth="6"
      strokeLinecap="round"
      cx="33"
      cy="33"
      r="30"
    />
  </svg>
)
