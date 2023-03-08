export default class LocalStorage {
  static avustushakuId(): number {
    return parseInt(window.localStorage.getItem('avustushakuId')!, 10)
  }

  static saveAvustushakuId(id: number): void {
    window.localStorage.setItem('avustushakuId', String(id))
  }
}
