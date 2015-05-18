function ApplicationListPage() {
  var api = {
    openPage: function(pageLoadedCheck) {
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage("/", pageLoadedCheck)
    },

    applications: function () {
      return S("#container")
          .filter(function () {
            return $(this).find("h1").length > 0
          })
          .map(function () {
            return { applicationName: $(this).find("h1").text().trim() }
          }).toArray()
    }
  }

  function applicationPageVisible() {
    return S("#menu-hakemukset").is(":visible") && api.applications().length > 0
  }

  return api
}
