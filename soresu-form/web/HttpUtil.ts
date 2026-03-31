async function fetchAndParse(
  url: string,
  init?: RequestInit
): Promise<{ data: any; response: Response }> {
  const response = await fetch(url, init)
  let data: any
  const text = await response.text()
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!response.ok) {
    throw new HttpResponseError(`Request failed with status ${response.status}`, {
      status: response.status,
      statusText: response.statusText,
      data,
    })
  }
  return { data, response }
}

export default class HttpUtil {
  static async get<T = any>(url: string): Promise<T> {
    const { data } = await fetchAndParse(url)
    return data as T
  }

  static async post(url: string, jsonData?: any, authToken?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authToken) {
      headers['Authorization'] = `Token ${authToken}`
    }
    const { data } = await fetchAndParse(url, {
      method: 'POST',
      headers,
      body: jsonData !== undefined ? JSON.stringify(jsonData) : undefined,
    })
    return data
  }

  static async put(url: string, requestData?: any, options?: RequestInit) {
    const isFormData = requestData instanceof FormData
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...((options?.headers as Record<string, string>) ?? {}),
    }
    const { data } = await fetchAndParse(url, {
      ...options,
      method: 'PUT',
      headers,
      body: isFormData
        ? requestData
        : requestData !== undefined
          ? JSON.stringify(requestData)
          : undefined,
    })
    return data
  }

  static putFile(url: string, file: string | Blob) {
    const formData = new FormData()
    formData.append('file', file)
    return HttpUtil.put(url, formData)
  }

  static async delete(url: string) {
    const { data } = await fetchAndParse(url, { method: 'DELETE' })
    return data
  }
}

interface HttpResponse {
  status: number
  statusText: string
  data: any
}

export class HttpResponseError extends Error {
  response: HttpResponse

  constructor(message: string, response: HttpResponse) {
    super(message)
    this.message = message
    this.name = 'HttpResponseError'
    this.response = response
    if (!Error.captureStackTrace) {
      return
    }
    Error.captureStackTrace(this, HttpResponseError)
  }
}

export const getHttpResponseErrorStatus = (e: unknown): number | undefined => {
  if (e instanceof HttpResponseError) {
    return e.response.status
  }
  return undefined
}
