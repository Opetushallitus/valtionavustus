function ApplicationListPage() {
  var api = {
    openPage: function(lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage("/?lang=" + lang, pageLoadedCheck)
    },
    applicationName: function() {
      return applicationElement().find("h1").first().text().trim()
    },
    changeLanguageButton: function (lang) {
      return Button(function() { return applicationElement().find("#" + lang)})
    },
    paSvenska: function () {
      var name = api.applicationName()
      return wait.until(api.changeLanguageButton('sv').isEnabled)()
             .then(api.changeLanguageButton('sv').click)
             .then(wait.until(function() {
                return name != api.applicationName()
              }))
    }
  }
  return api

  function applicationElement() {
    return S("#container")
  }

  function applicationPageVisible() {
    return applicationElement().is(":visible") && api.applicationName().length > 0
  }

  function Button(el) {
    return {
      element: function() {
        return el()
      },
      isEnabled: function () {
        return !el().prop("disabled")
      },
      isVisible: function() {
        return el().is(":visible")
      },
      click: function () {
        el()[0].click()
      }
    }
  }
}
