import * as Bacon from 'baconjs'

export default class InternalBus {
  private readonly busCache: {
    [key: string]: Bacon.Bus<any>
  }

  constructor() {
    this.busCache = {}
  }

  stream(name: string): Bacon.Bus<any> {
    return this.bus(name)
  }

  push(name: string, value: any): void {
    try {
      this.bus(name).push(value)
    } catch (e) {
      console.error('Error when event "' + name + '" handling with value ', value, e)
    }
  }

  plug(name: string, value: any): void {
    this.bus(name).plug(value)
  }

  bus(name: string): Bacon.Bus<any> {
    return (this.busCache[name] = this.busCache[name] || new Bacon.Bus())
  }
}
