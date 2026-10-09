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

type Suggestion = { 'organization-name': string; 'application-count': number }
type SearchTerm = { term: string; 'hit-count': number; suggestions: Suggestion[] }
type TextPart = { text: string; match: boolean }
type SearchResults = {
  terms: SearchTerm[]
  hakemukset: (HakemusV2 & {
    'organization-name-parts': TextPart[]
    'project-name-parts': TextPart[]
  })[]
  avustushaut: (AvustushakuV2 & { 'name-parts': TextPart[] })[]
}
type SearchHakemus = SearchResults['hakemukset'][number]
type SearchHaku = SearchResults['avustushaut'][number]

type LoadingState = 'initial' | 'loading' | 'done' | 'error'

const searchStateText: Record<LoadingState, string> = {
  initial: 'Ei hakutuloksia',
  done: 'Ei hakutuloksia',
  loading: 'Ladataan...',
  error: 'Haku epäonnistui',
}

const isSearchLongEnough = (search: string) => search.length > 2

const Search = () => {
  const query = new URLSearchParams(window.location.search)
  const search = query.get('search') ?? ''
  const [input, setInput] = useState(search)
  const order = query.get('order') || 'created-at-desc'
  const [terms, setTerms] = useState<SearchTerm[]>([])
  const [hakemukset, setHakemukset] = useState<SearchHakemus[]>([])
  const [haut, setHaut] = useState<SearchHaku[]>([])
  const [searchState, setSearchState] = useState<LoadingState>(
    isSearchLongEnough(search) ? 'loading' : 'initial'
  )

  const doSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!isSearchLongEnough(input)) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    setSearchState('loading')
    setHakemukset([])
    setHaut([])
  }

  useEffect(() => {
    const loadResults = async () => {
      try {
        const results = await HttpUtil.get<SearchResults>(
          `/api/v2/search/${window.location.search}`
        )
        setTerms(results.terms)
        setHakemukset(results.hakemukset)
        setHaut(results.avustushaut)
        setSearchState('done')
      } catch (e: unknown) {
        setSearchState('error')
      }
    }

    if (isSearchLongEnough(search)) {
      void loadResults()
    }
  }, [])

  return (
    <>
      <form onSubmit={doSearch} className={styles.form}>
        <input
          name="search"
          placeholder="Hakusanan pituus tulee olla yli kolme merkkiä"
          className="oph-input"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          readOnly={searchState === 'loading'}
          autoFocus
        />
        <div className="oph-select-container">
          <select
            name="order"
            defaultValue={order}
            className="oph-input oph-select"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            <option value="created-at-desc">Uusin ensin</option>
            <option value="created-at-asc">Vanhin ensin</option>
          </select>
        </div>
      </form>
      <div className={styles.hint}>
        Erota hakusanat pilkulla: <code>helsinki, vantaa</code> · haku osuu sanan alkuun
      </div>
      {searchState === 'done' && terms.length > 0 && (
        <>
          <TermChips terms={terms} />
          <div className={styles.count}>
            <b>{hakemukset.length}</b> hakemusta · <b>{haut.length}</b> avustushakua
          </div>
          <SuggestionBox terms={terms} order={order} />
        </>
      )}
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

const TermChips = ({ terms }: { terms: SearchTerm[] }) => (
  <div className={styles.chips}>
    {terms.map(({ term, 'hit-count': hitCount }) => (
      <span
        key={term}
        className={hitCount === 0 ? `${styles.chip} ${styles.zero}` : styles.chip}
        data-test-class="search-term-chip"
        data-hit-count={hitCount}
      >
        {term}
        <b className={styles.chipCount}>{hitCount}</b>
      </span>
    ))}
  </div>
)

const searchUrlReplacingTerm = (
  terms: SearchTerm[],
  term: string,
  replacement: string,
  order: string
) => {
  const search = terms.map((t) => (t.term === term ? replacement : t.term)).join(', ')
  return `?${new URLSearchParams({ search, order })}`
}

const SuggestionBox = ({ terms, order }: { terms: SearchTerm[]; order: string }) => {
  const termsWithSuggestions = terms.filter((term) => term.suggestions.length)
  if (termsWithSuggestions.length === 0) {
    return null
  }
  return (
    <div className={styles.suggestions} data-test-id="search-suggestions">
      Ei osumia. Tarkoititko:
      {termsWithSuggestions.map(({ term, suggestions }) => (
        <div key={term}>
          <span className={styles.muted}>{term} →</span>{' '}
          {suggestions.map((suggestion, i) => {
            const name = suggestion['organization-name']
            return (
              <React.Fragment key={name}>
                {i > 0 && ' · '}
                <a href={searchUrlReplacingTerm(terms, term, name, order)}>{name}</a>{' '}
                <span className={styles.muted}>({suggestion['application-count']})</span>
              </React.Fragment>
            )
          })}
        </div>
      ))}
    </div>
  )
}

const renderParts = (parts: TextPart[]) =>
  parts.map(({ text, match }, i) => (match ? <mark key={i}>{text}</mark> : text))

const dateFormat = 'D.M.YYYY H:mm'

const renderHaku = (haku: SearchHaku) => {
  return (
    <div key={`haku-result-${haku.id}`} data-test-class="avustushaku-result">
      <a href={`/avustushaku/${haku.id}/`} target="_blank">
        <h2>
          {haku['register-number']} - {renderParts(haku['name-parts'])}
        </h2>
      </a>
      <span>
        {moment(haku.content.duration.start).format(dateFormat)} -{' '}
        {moment(haku.content.duration.end).format(dateFormat)}
      </span>
    </div>
  )
}

const renderHakemus = (hakemus: SearchHakemus) => {
  return (
    <div key={`hakemus-result-${hakemus.id}`} data-test-class="hakemus-result">
      <a
        href={`/avustushaku/${hakemus['grant-id']}/hakemus/${hakemus['parent-id'] ?? hakemus.id}/`}
        target="_blank"
      >
        <h2>
          {hakemus['register-number']} - {renderParts(hakemus['organization-name-parts'])}
        </h2>
      </a>
      <div>
        <span className={styles.rowTitle}>Avustushaku</span>
        {hakemus['grant-name']}
      </div>
      {hakemus['project-name'] && (
        <div>
          <span className={styles.rowTitle}>Hanke</span>
          {renderParts(hakemus['project-name-parts'])}
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
