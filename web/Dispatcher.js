import Bacon from 'baconjs'

export default class InternalBus {

  constructor() {
    this.busCache = {}
  }

  stream(name) {
    return this.bus(name)
  }

  push(name, value) {
    this.bus(name).push(value)
  }

  plug(name, value) {
    this.bus(name).plug(value)
  }

  bus(name) {
    return this.busCache[name] = this.busCache[name] || new Bacon.Bus()
  }
}
