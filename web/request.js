var request = function(method, url, success, error, data) {
  var xhr = new XMLHttpRequest()
  xhr.open(method, url, true)
  xhr.responseType = "json"
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.onload = (event) => success(xhr.response)
  xhr.onerror = error
  if (url.indexOf('reaktor.fi') >= 0) xhr.withCredentials = true
  xhr.send(data)
}
export var GET = request.bind(undefined, "GET")
export var POST = request.bind(undefined, "POST")
export var DELETE = request.bind(undefined, "DELETE")
