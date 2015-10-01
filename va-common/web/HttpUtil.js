import axios from 'axios'
import Promise from 'bluebird'

export default class HttpUtil {

  static get(url) {
    return HttpUtil.handleResponse(axios.get(url))
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
    return new Promise(function(resolve, reject) {
      httpCall
        .then(function(response) {
          resolve(response.data)
        })
        .catch(function(response) {
          reject({
            status: response.status,
            statusText: response.statusText,
            data: response.data
          })
        })
    })
  }
}
