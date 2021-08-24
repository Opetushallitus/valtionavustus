export default class LocalStorage {
  static avustushakuId() {
    return parseInt(window.localStorage.getItem("avustushakuId"), 10)
  }

  static saveAvustushakuId(id){
    window.localStorage.setItem("avustushakuId", id)
  }
}
