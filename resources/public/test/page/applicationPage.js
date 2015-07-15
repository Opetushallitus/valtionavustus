function ApplicationPage() {
  var storedHakemusId
  var api = {
    openStartPage: function(lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function() { return "/?avustushaku=1&devel=true&lang=" + lang}, pageLoadedCheck)
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
      var found = applicationElement().find("#" + escapeSelector(id)).first()
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
      return wait.until(function() {
        return api.elementText("pending-changes") != "true" && "Kaikki muutokset tallennettu" === api.saveInfo()
      })()
    },
    submitButton: function() {
      return Clickable(function() { return applicationElement().find("#submit")})
    },
    saveInfo: function() {
      return applicationElement().find("#form-controls .info :visible").text()
    },
    validationErrors: function() {
      return applicationElement().find("#validation-errors-summary:not([hidden])").text()
    },
    error: function(field) {
      return applicationElement().find("#" + escapeSelector(field) + "-error").first().text()
    },
    classAttributeOf: function(htmlId) {
      return applicationElement().find("#" + escapeSelector(htmlId)).first().attr("class")
    },
    previewButton: function() {
      return Clickable(function() { return applicationElement().find("button:contains(Tallennettu versio)")})
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
        return !el().prop("disabled")
      },
      isVisible: function() {
        return el().is(":visible")
      },
      text: function() {
        return el().text()
      },
      click: function () {
        el()[0].click()
      }
    }
  }
}
