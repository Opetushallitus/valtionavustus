function ApplicationPage() {
  var pageApi = Page(applicationElement)

  var basePath = "/avustushaku/1/index.html"

  var api = {
    openEditPage: function(hakemusIdGetter, lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function() { return basePath + "?avustushaku=1&devel=true&hakemus=" + hakemusIdGetter() + "&lang=" + lang}, pageLoadedCheck)
    },
    openPreview: function(hakemusIdGetter, lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function() { return basePath + "?preview=true&devel=true&avustushaku=1&hakemus=" + hakemusIdGetter() + "&lang=" + lang}, pageLoadedCheck)
    },
    applicationName: function() {
      return applicationElement().find("#container h1").first().text().trim()
    },
    toggleLanguageButton: function () {
      return pageApi.createClickable(function() { return applicationElement().find("#toggle-language") })
    },
    waitAutoSave: function() {
      var errorBefore =  api.saveError()
      return wait.until(function() {
        return pageApi.elementText("pending-changes") != "true" && "Kaikki muutokset tallennettu" === api.saveInfo() || api.saveError() !== errorBefore
      })()
    },
    submitButton: function() {
      return pageApi.createClickable(function() { return applicationElement().find("#submit") })
    },
    submitAndWaitErrorChange: function() {
      var errorBefore =  api.saveError()
      api.submitButton().click()
      return wait.until(function() {
        return api.saveError() !== errorBefore
      })()
    },
    submitAndWaitOk: function() {
      var textBefore =  api.submitButton().text()
      api.submitButton().click()
      return wait.until(function() {
        return api.submitButton().text() !== textBefore
      })()
    },
    saveInfo: function() {
      return applicationElement().find("#form-controls .info :visible").text()
    },
    saveError: function() {
      return applicationElement().find("#form-error-summary .error:visible").text()
    },
    validationErrorsSummary: function() {
      return applicationElement().find("#validation-errors-summary:not([hidden])").text()
    },
    validationErrorsButton: function() {
      return pageApi.createClickable(function() { return applicationElement().find("#validation-errors-summary") })
    },
    validationErrors: function() {
      return applicationElement().find("#validation-errors:not([hidden])")
    },
    detailedValidationErrors: function() {
      const errorMessageElements = applicationElement().find("#validation-errors").find('div.error')
      return _.map(errorMessageElements, function(element) { return S(element).text() })
    },
    toggleLanguage: function () {
      var name = api.applicationName()
      return wait.until(api.toggleLanguageButton().isEnabled)()
             .then(api.toggleLanguageButton().click())
             .then(wait.until(function() {
                return name != api.applicationName()
              }))
    }
  }
  return _.extend(pageApi, api)

  function applicationElement() {
    return S("#app")
  }

  function applicationPageVisible() {
    return applicationElement().is(":visible") && api.applicationName().length > 0
  }

  function escapeSelector(s){
    return s.replace( /(:|\.|\[|\])/g, "\\$1" )
  }
}
