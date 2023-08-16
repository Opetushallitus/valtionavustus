import { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash'

import HttpUtil from 'soresu-form/web/HttpUtil'

import { VaUserSearch } from './types'

export const minimumSearchInputLength = 2
const searchDebounceMillis = 300

const initialVaUserSearch: VaUserSearch = {
  loading: false,
  result: {
    error: false,
    results: [],
  },
}

export function useVaUserSearch(): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  VaUserSearch,
] {
  const [searchInput, setSearchInput] = useState('')
  const [vaUserSearch, setVaUserSearch] = useState<VaUserSearch>(initialVaUserSearch)
  const fetchData = async (searchInput: string) => {
    try {
      setVaUserSearch({ ...vaUserSearch, loading: true })
      const result = await HttpUtil.post('/api/va-user/search', {
        searchInput,
      })
      setVaUserSearch({ ...vaUserSearch, loading: false, result })
    } catch (e: unknown) {
      setVaUserSearch({
        ...vaUserSearch,
        loading: false,
        result: { error: true, results: [] },
      })
    }
  }
  const debouncedFetch = useCallback(debounce(fetchData, searchDebounceMillis), [])

  useEffect(() => {
    if (searchInput.length < minimumSearchInputLength) {
      setVaUserSearch({
        ...vaUserSearch,
        loading: false,
        result: { error: false, results: [] },
      })
    } else {
      debouncedFetch(searchInput)
    }
  }, [searchInput])

  return [searchInput, setSearchInput, vaUserSearch]
}
