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
    }
  }
  return api

  function applicationElement() {
    return S("#container")
  }

  function applicationPageVisible() {
    return applicationElement().is(":visible") && api.applicationName().length > 0
  }

}
