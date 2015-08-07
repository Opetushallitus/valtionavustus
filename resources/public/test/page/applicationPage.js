function ApplicationPage() {
  var storedHakemusId
  var api = {
    openLoginPage: function(lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function() { return "/login.html?avustushaku=1&devel=true&lang=" + lang}, pageLoadedCheck)
    },
    login: function() {
      api.setInputValue("primary-email", "yhteyshenkilo@example.com")()
      api.submitButton().click()
      return wait.until(api.hakemusIdIsPresent)().then(
        api.storeHakemusIdFromHtml
      )
    },
    openEditPage: function(hakemusIdGetter, lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function() { return "/?avustushaku=1&devel=true&hakemus=" + hakemusIdGetter() + "&lang=" + lang}, pageLoadedCheck)
    },
    openPreview: function(hakemusIdGetter, lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function() { return "/?preview=true&devel=true&avustushaku=1&hakemus=" + hakemusIdGetter() + "&lang=" + lang}, pageLoadedCheck)
    },
    elementText: function(id) {
      return api.elementTextBySelector("#" + escapeSelector(id))
    },
    elementTextBySelector: function(selector) {
      var found = applicationElement().find(selector).first()
      if (found.prop("tagName") === "TEXTAREA" ||
          found.prop("tagName") === "INPUT" ||
          found.prop("tagName") === "SELECT") {
        throw new Error("Use Input.value() to read inputs from form elements")
      }
      return found.text().trim()
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
      return api.elementText("entity-id")
    },
    getHakemusId: function() {
      return storedHakemusId
    },
    toggleLanguageButton: function () {
      return Clickable(function() { return applicationElement().find("#toggle-language")})
    },
    waitAutoSave: function() {
      var errorBefore =  api.saveError()
      return wait.until(function() {
        return api.elementText("pending-changes") != "true" && "Kaikki muutokset tallennettu" === api.saveInfo() || api.saveError() !== errorBefore
      })()
    },
    submitButton: function() {
      return Clickable(function() { return applicationElement().find("#submit")})
    },
    submitAndWaitErrorChange: function() {
      var errorBefore =  api.saveError()
      api.submitButton().click()
      return wait.until(function() {
        return api.saveError() !== errorBefore
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
      return Clickable(function() { return applicationElement().find("#validation-errors-summary")})
    },
    validationErrors: function() {
      return applicationElement().find("#validation-errors:not([hidden])")
    },
    detailedValidationErrors: function() {
      const errorMessageElements = applicationElement().find("#validation-errors").find('div.error')
      return _.map(errorMessageElements, function(element) { return S(element).text() })
    },
    classAttributeOf: function(htmlId) {
      return applicationElement().find("#" + escapeSelector(htmlId)).first().attr("class")
    },
    getInput: function(name) {
      return Input(function () {
        return applicationElement().find("[name='" + name + "']")
      })
    },
    getRadioLabel: function(name) {
      return Input(function () {
        return applicationElement().find("[for='" + name + "']")
      })
    },
    setInputValue: function(name, value) {
      return function() {
        var isRadio = api.getInput(name).attr("type") === "radio"
        var input = api.getInput(name)
        var visibleElement = isRadio ? api.getRadioLabel(name) : input
        return wait.until(visibleElement.isVisible)()
            .then(input.setValue(value))
      }
    },
    toggleLanguage: function () {
      var name = api.applicationName()
      return wait.until(api.toggleLanguageButton().isEnabled)()
             .then(api.toggleLanguageButton().click())
             .then(wait.until(function() {
                return name != api.applicationName()
              }))
    },
    createClickable: function(el) {
      return new Clickable(function() { return applicationElement().find(el) })
    }
  }
  return api

  function applicationElement() {
    return S("#app")
  }

  function applicationPageVisible() {
    return applicationElement().is(":visible") && api.applicationName().length > 0
  }

  function escapeSelector(s){
    return s.replace( /(:|\.|\[|\])/g, "\\$1" )
  }

  function Input(el) {
    return {
      element: function() {
        return el()
      },
      value: function() {
        return el().val()
      },
      attr: function(name) {
        return el().attr(name)
      },
      isVisible: function() {
        return el().is(":visible")
      },
      isEnabled: function () {
        return el().is(":enabled")
      },
      setValue: function(value) {
        var input = el()
        switch (inputType(input)) {
          case "EMAIL":
          case "TEXT":
          case "TEXTAREA":
            input.val(value)
            triggerEvent(input, "input")
            break;
          case "RADIO":
            var radioOption = _(input).find(function(item) { return $(item).prop("value") == value })
            S(radioOption).click()
            triggerEvent(S(radioOption), "click")
            break;
          case "SELECT":
            var option = _(input.children()).find(function(item) { return $(item).prop("value") == value })
            input.val($(option).attr("value"))
            triggerEvent(input, "change")
            break;
        }
      }
    }

    function inputType(el) {
      if (el.prop("tagName") == "SELECT" || el.prop("tagName") == "TEXTAREA")
        return el.prop("tagName")
      else
        return el.prop("type").toUpperCase()
    }
  }

  function Clickable(el) {
    return {
      element: function() {
        return el()
      },
      isEnabled: function () {
        return el().is(":enabled")
      },
      isVisible: function() {
        return el().is(":visible")
      },
      text: function() {
        return el().text()
      },
      click: function () {
        triggerEvent(el().first(), "click")
      }
    }
  }
}
