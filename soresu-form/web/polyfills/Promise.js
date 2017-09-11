import Promise from "bluebird"

if (typeof window.Promise !== "function") {
  window.Promise = Promise
}
