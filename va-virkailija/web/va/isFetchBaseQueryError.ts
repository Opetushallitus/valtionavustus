import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error
}

export function hasFetchErrorMsg(error: unknown): error is { data: { error: string } } {
  return (
    isFetchBaseQueryError(error) &&
    typeof error.data === 'object' &&
    error.data != null &&
    'error' in error.data &&
    typeof error.data.error === 'string'
  )
}
