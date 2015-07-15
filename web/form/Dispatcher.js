import Bacon from 'baconjs'

export default class InternalBus {

  constructor() {
    this.busCache = {}
  }

  stream(name) {
    return this.bus(name)
  }

  push(name, value) {
    try {
      this.bus(name).push(value)
    } catch (e) {
      console.log('Error when event "' + name + '" handling with value ', value, e)
    }
  }

  plug(name, value) {
    this.bus(name).plug(value)
  }

  bus(name) {
    return this.busCache[name] = this.busCache[name] || new Bacon.Bus()
  }
}
