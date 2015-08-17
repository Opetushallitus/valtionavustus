import axios from 'axios'
import Promise from 'bluebird'

export default class HttpUtil {

  static get(url) {
    return HttpUtil.handleResponse(axios.get(url))
  }

  static post(url, jsonData) {
    return HttpUtil.handleResponse(axios.post(url, jsonData))
  }

  static put(url, jsonData) {
    return HttpUtil.handleResponse(axios.put(url, jsonData))
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
