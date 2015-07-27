import qwest from 'qwest'

export default class HttpUtil {
  static get(url) {
    return qwest.get(url)
  }

  static post(url, jsonData) {
    return qwest.post(url, jsonData, {dataType: "json"})
  }

  static put(url, jsonData) {
    return qwest.put(url, jsonData, {dataType: "json"})
  }
}
