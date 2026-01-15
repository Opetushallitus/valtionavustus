import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import moment from 'moment'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

import { AvustushakuV2, HakemusV2, UserInfo } from '../types'
import { HeaderContainer } from '../common-components/Header'
import HakemusArviointiStatuses from '../HakemusArviointiStatuses'

import 'oph-virkailija-style-guide/oph-styles-min.css'
import 'soresu-form/web/form/style/theme.css'
import '../style/main.css'
import * as styles from './Search.module.css'
import LoadingSitePage from '../common-components/LoadingSitePage'
import ErrorBoundary from '../common-components/ErrorBoundary'

interface Data {
  environment: EnvironmentApiResponse
  userInfo: UserInfo
}

const SearchApp = () => {
  const [data, setData] = useState<Data>()
  useEffect(() => {
    async function fetchNeeded() {
      const [environment, userInfo] = await Promise.all([
        HttpUtil.get(`/environment`),
        HttpUtil.get(`/api/userinfo`),
      ])
      setData({ environment, userInfo })
    }
    fetchNeeded()
  }, [])

  if (!data) {
    return <LoadingSitePage />
  } else {
    return (
      <>
        <HeaderContainer
          activeTab="search"
          environment={data.environment}
          userInfo={data.userInfo}
        />
        <div className={styles.container}>
          <div className={styles.body}>
            <Search />
          </div>
        </div>
      </>
    )
  }
}

const orderByCreatedAt = <T extends { 'created-at': string }>(array: T[], order: string) => {
  const newArray = [...array]
  newArray.sort((a, b) =>
    order === 'created-at-asc'
      ? a['created-at'] >= b['created-at']
        ? 1
        : -1
      : a['created-at'] < b['created-at']
        ? 1
        : -1
  )
  return newArray
}

type LoadingState = 'initial' | 'loading' | 'error'

const searchStateText: Record<LoadingState, string> = {
  initial: 'Ei hakutuloksia',
  loading: 'Ladataan...',
  error: 'Haku epäonnistui',
}

const Search = () => {
  const query = new URLSearchParams(window.location.search)
  const [input, setInput] = useState(query.get('search') ?? '')
  const [order, setOrder] = useState(query.get('order') ?? 'created-at-asc')
  const [hakemukset, setHakemukset] = useState<HakemusV2[]>([])
  const [haut, setHaut] = useState<AvustushakuV2[]>([])
  const [searchState, setSearchState] = useState<LoadingState>('initial')
  const sending = searchState === 'loading'
  const disabled = sending

  const doSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    if (input.length < 3) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    setSearchState('loading')
    setHakemukset([])
    setHaut([])
  }

  useEffect(() => {
    const doSearch = async () => {
      setSearchState('loading')
      try {
        const [newHakemukset, newHaut] = await Promise.all([
          HttpUtil.get<HakemusV2[]>(`/api/v2/applications/${window.location.search}`),
          HttpUtil.get<AvustushakuV2[]>(`/api/v2/grants/${window.location.search}`),
        ])
        setHakemukset(newHakemukset)
        setHaut(newHaut)
        setSearchState('initial')
      } catch (e: unknown) {
        setSearchState('error')
      }
    }

    const params = new URLSearchParams(window.location.search)
    const search = params.get('search')
    if (search && search.length > 2) {
      void doSearch()
    }
  }, [])

  useEffect(() => {
    setHakemukset(orderByCreatedAt(hakemukset, order))
    setHaut(orderByCreatedAt(haut, order))
  }, [order])

  return (
    <>
      <form onSubmit={doSearch} className={styles.form}>
        <input
          name="search"
          placeholder="Hakusanan pituus tulee olla yli kolme merkkiä"
          className="oph-input"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          readOnly={disabled}
          autoFocus
        />
        <div className="oph-select-container">
          <select
            name="order"
            defaultValue={query.get('order') || 'created-at-desc'}
            className="oph-input oph-select"
            onChange={(e) => setOrder(e.target.value)}
          >
            <option value="created-at-desc">Uusin ensin</option>
            <option value="created-at-asc">Vanhin ensin</option>
          </select>
        </div>
      </form>
      <div className={styles.results}>
        <div>
          <h1>Avustushaut</h1>
          {haut.length ? (
            <div data-test-class="results">{haut.map(renderHaku)}</div>
          ) : (
            <div>{searchStateText[searchState]}</div>
          )}
        </div>
        <div>
          <h1>Hakemukset</h1>
          {hakemukset.length ? (
            <div data-test-class="results">{hakemukset.map(renderHakemus)}</div>
          ) : (
            <div>{searchStateText[searchState]}</div>
          )}
        </div>
      </div>
    </>
  )
}

const dateFormat = 'D.M.YYYY H:mm'

const renderHaku = (haku: AvustushakuV2) => {
  return (
    <div key={`haku-result-${haku.id}`} data-test-class="avustushaku-result">
      <a href={`/avustushaku/${haku.id}/`} target="_blank">
        <h2>
          {haku['register-number']} - {haku.content.name.fi}
        </h2>
      </a>
      <span>
        {moment(haku.content.duration.start).format(dateFormat)} -{' '}
        {moment(haku.content.duration.end).format(dateFormat)}
      </span>
    </div>
  )
}

const renderHakemus = (hakemus: HakemusV2) => {
  return (
    <div key={`hakemus-result-${hakemus.id}`} data-test-class="hakemus-result">
      <a
        href={`/avustushaku/${hakemus['grant-id']}/hakemus/${hakemus['parent-id'] ?? hakemus.id}/`}
        target="_blank"
      >
        <h2>
          {hakemus['register-number']} - {hakemus['organization-name']}
        </h2>
      </a>
      <div>
        <span className={styles.rowTitle}>Avustushaku</span>
        {hakemus['grant-name']}
      </div>
      {hakemus['project-name'] && (
        <div>
          <span className={styles.rowTitle}>Hanke</span>
          {hakemus['project-name']}
        </div>
      )}
      <div>
        <span className={styles.rowTitle}>Hakemusta päivitetty</span>
        {moment(hakemus['created-at']).format(dateFormat)}
      </div>
      <div>
        <span className={styles.rowTitle}>Haettu summa</span>
        {hakemus['budget-oph-share']}
      </div>
      <div>
        <span className={styles.rowTitle}>Myönnetty summa</span>
        {hakemus.evaluation?.['budget-granted']}
      </div>
      <div>
        <span className={styles.rowTitle}>Koulutusaste</span>
        {hakemus.evaluation?.rahoitusalue}
      </div>
      <div>
        <span className={styles.rowTitle}>Talousarviotili</span>
        {hakemus.evaluation?.talousarviotili}
      </div>
      <div>
        <span className={styles.rowTitle}>Tila</span>
        {hakemus.evaluation?.status &&
          HakemusArviointiStatuses.statusToFI(hakemus.evaluation?.status)}
      </div>
      {hakemus.evaluation?.['should-pay'] === false && (
        <div>
          <span className={styles.rowTitle}>Avustusta ei makseta</span>
          {hakemus.evaluation['should-pay-comments']}
        </div>
      )}
      {hakemus.refused && (
        <div>
          <span className={styles.rowTitle}>Ei ota vastaan</span>
          {hakemus['refused-comment']}
        </div>
      )}
    </div>
  )
}

const app = document.getElementById('app')
const root = createRoot(app!)
root.render(
  <ErrorBoundary>
    <SearchApp />
  </ErrorBoundary>
)
