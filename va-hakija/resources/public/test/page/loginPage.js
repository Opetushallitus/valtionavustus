function LoginPage() {
  var storedHakemusId
  var pageApi = Page(applicationElement)

  var api = {
    openLoginPage: function (lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function () {
        return "/avustushaku/1/?avustushaku=1&devel=true&lang=" + lang
      }, pageLoadedCheck)
    },
    login: function () {
      pageApi
        .setInputValue("primary-email", "yhteyshenkilo@example.com")()
        .then(function() {
          api.submitButton().click()
        })
      return wait.until(api.hakemusIdIsPresent)().then(
        api.storeHakemusIdFromHtml
      )
    },
    submitButton: function() {
      return pageApi.createClickable(function() { return applicationElement().find("#submit") })
    },
    applicationName: function() {
      return applicationElement().find("#container h1").first().text().trim()
    },
    storeHakemusIdFromHtml: function() {
      storedHakemusId = api.readHakemusIdFromHtml()
    },
    hakemusIdIsPresent: function() {
      return api.readHakemusIdFromHtml().length > 0
    },
    readHakemusIdFromHtml: function() {
      return pageApi.elementText("entity-id")
    },
    getHakemusId: function() {
      return storedHakemusId
    },
    waitUntilSubmitIsEnabled: function() {
      return wait.until(function() {
        return api.submitButton().isEnabled()
      })()
    },
    message: function() {
      return applicationElement().find(".message")
    }
  }
  return _.extend(pageApi, api)

  function applicationElement() {
    return S("#app")
  }

  function applicationPageVisible() {
    return applicationElement().is(":visible") && api.applicationName().length > 0
  }
}
