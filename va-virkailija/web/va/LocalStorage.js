export default class LocalStorage {

  static avustushakuId() {
    return window.localStorage.getItem("avustushakuId")
  }
  static saveAvustushakuId(id){
    window.localStorage.setItem("avustushakuId",id)
  }
}