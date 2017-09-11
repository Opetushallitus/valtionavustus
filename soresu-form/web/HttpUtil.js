import axios from 'axios'
import Promise from 'bluebird'

const errorHasResponse = error =>
  !!error.response && (typeof error.response === "object")

export default class HttpUtil {
  static get(url) {
    return HttpUtil.handleResponse(axios.get(url))
  }

  static delete(url) {
    return HttpUtil.handleResponse(axios.delete(url))
  }

  static post(url, jsonData) {
    return HttpUtil.handleResponse(axios.post(url, jsonData))
  }

  static put(url, requestData, options) {
    return HttpUtil.handleResponse(axios.put(url, requestData, options))
  }

  static putFile(url, file) {
    const formData = new FormData()
    formData.append('file', file)
    return HttpUtil.put(url, formData)
  }

  static delete(url) {
    return HttpUtil.handleResponse(axios.delete(url))
  }

  static handleResponse(httpCall) {
    return Promise.resolve(httpCall)
      .then(response => response.data)
      .catch(errorHasResponse, error => {
        const res = error.response
        throw new HttpResponseError(error.toString(), {
          status: res.status,
          statusText: res.statusText,
          data: res.data
        })
      })
  }
}

export function HttpResponseError(message, response) {
  this.message = message
  this.name = "HttpResponseError"
  this.response = response

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, HttpResponseError)
  }
}

HttpResponseError.prototype = Object.create(Error.prototype)
HttpResponseError.prototype.constructor = HttpResponseError
