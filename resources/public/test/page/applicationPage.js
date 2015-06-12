function ApplicationPage() {
  var api = {
    openPage: function(lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function() { return "/?avustushaku=1&lang=" + lang}, pageLoadedCheck)
    },
    openPreview: function(hakemusIdGetter, lang, pageLoadedCheck) {
      if (!lang) {
        lang = 'fi'
      }
      if (!pageLoadedCheck) {
        pageLoadedCheck = applicationPageVisible
      }
      return openPage(function() { return "/?preview=true&avustushaku=1&hakemus=" + hakemusIdGetter() + "&lang=" + lang}, pageLoadedCheck)
    },
    elementText: function(id) {
      return applicationElement().find("#" + id).first().text().trim()
    },
    applicationName: function() {
      return applicationElement().find("#container h1").first().text().trim()
    },
    hakemusId: function() {
      return api.elementText("hakemus-id")
    },
    toggleLanguageButton: function () {
      return Clickable(function() { return applicationElement().find("#toggle-language")})
    },
    submitButton: function() {
      return Clickable(function() { return applicationElement().find("[type='submit']")})
    },
    saveWaitError: function() {
      api.submitButton().click()
      return wait.until(function() { return api.saveError().length > 0 })()
    },
    saveError: function() {
      return applicationElement().find("#submit-error").first().text()
    },
    error: function(field) {
      return applicationElement().find("#" + field + "-error").first().text()
    },
    previewButton: function() {
      return Clickable(function() { return applicationElement().find("button:contains(Tallennettu versio)")})
    },
    getInput: function(name) {
      return Input(function () {
        return applicationElement().find("[name=" + name + "]")
      })
    },
    setInputValue: function(name, value) {
      return function() {
        var input = api.getInput(name)
        return wait.until(input.isVisible)()
            .then(input.setValue(value))
      }
    },
    setRadioValue: function(name, value) {
      return function() {
        var input = api.getInput(name)
        return wait.until(function() {
           return  applicationElement().find("[for=" + name + "]").is(":visible")
          })().then(input.setValue(value))
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

  function Input(el) {
    return {
      element: function() {
        return el()
      },
      value: function() {
        return el().val()
      },
      isVisible: function() {
        return el().is(":visible")
      },
      setValue: function(value) {
        var input = el()
        switch (inputType(input)) {
          case "TEXT":
          case "TEXTAREA":
            input.val(value)
            triggerEvent(input, "input")
            break;
          case "RADIO":
            var option = _(input).find(function(item) { return $(item).prop("value") == value })
            $(option).click()
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
