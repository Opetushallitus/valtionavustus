var expect = chai.expect
chai.should()
chai.config.truncateThreshold = 0; // disable truncating

function S(selector) {
  try {
    if (!testFrame() || !testFrame().jQuery) {
      return $([])
    }
    return testFrame().jQuery(selector)
  } catch (e) {
    console.log("Premature access to testFrame.jQuery, printing stack trace.")
    console.log(new Error().stack);
    throw e;
  }
}

wait = {
  waitIntervalMs: 10,
  until: function(condition, maxWaitMs) {
    return function() {
      if (maxWaitMs == undefined) maxWaitMs = testTimeoutDefault;
      var deferred = Q.defer()
      var count = Math.floor(maxWaitMs / wait.waitIntervalMs);

      (function waitLoop(remaining) {
        if (condition()) {
          deferred.resolve()
        } else if (remaining === 0) {
          const errorStr = "timeout of " + maxWaitMs + "ms in wait.until for condition:\n" + condition
          console.error(new Error(errorStr))
          deferred.reject(errorStr)
        } else {
          setTimeout(function() {
            waitLoop(remaining-1)
          }, wait.waitIntervalMs)
        }
      })(count)
      return deferred.promise
    }
  },
  untilFalse: function(condition) {
    return wait.until(function() { return !condition()})
  },
  forMilliseconds: function(ms) {
    return function() {
      var deferred = Q.defer()
      setTimeout(function() {
        deferred.resolve()
      }, ms)
      return deferred.promise
    }
  }
}

mockAjax = {
  init: function() {
    var deferred = Q.defer()
    if (testFrame().sinon)
      deferred.resolve()
    else
      testFrame().$.getScript('test/lib/sinon-server-1.15.0.js', function() { deferred.resolve() } )
    return deferred.promise
  },
  respondOnce: function (method, url, responseCode, responseObject) {
    var fakeAjax = function() {
      var xhr = sinon.useFakeXMLHttpRequest()
      xhr.useFilters = true
      xhr.addFilter(function(method, url) {
        var requestedFakeUrl = url.indexOf(_fakeAjaxParams.url) === 0
        return !requestedFakeUrl || method != _fakeAjaxParams.method
      })
      xhr.onCreate = function (request) {
        window.setTimeout(function() {
          if (window._fakeAjaxParams && request.method === _fakeAjaxParams.method && request.url.indexOf(_fakeAjaxParams.url) === 0) {
            console.log("Faking", _fakeAjaxParams.responseCode, "response", _fakeAjaxParams.responseObject, "to", _fakeAjaxParams.method, request.url)
            request.respond(_fakeAjaxParams.responseCode, { "Content-Type": "application/json" }, JSON.stringify(_fakeAjaxParams.responseObject))
            xhr.restore()
            delete _fakeAjaxParams
          }
        }, 0)
      }
    }

    testFrame()._fakeAjaxParams = { method: method, url: url, responseCode: responseCode, responseObject: responseObject }
    testFrame().eval("(" + fakeAjax.toString() + ")()")
  }
}

function getJson(url) {
  return Q($.ajax({url: url, dataType: "json" }))
}

function testFrame() {
  return $("#testframe").get(0).contentWindow
}

function triggerEvent(element, eventName) {
  const evt = new (testFrame().window).Event(eventName, {bubbles: true, cancellable: true})
  evt.simulated = true
  element[0].dispatchEvent(evt);
}

function openPage(pathGetter, predicate) {
  if (!predicate) {
    predicate = function() { return testFrame().jQuery }
  }
  return function() {
    var newTestFrame = $('<iframe>').attr({src: pathGetter(), width: 1024, height: 800, id: "testframe"}).load(function() {
      var jquery = document.createElement("script")
      jquery.type = "text/javascript"
      jquery.src = "//code.jquery.com/jquery-1.11.1.min.js"
      $(this).contents().find("head")[0].appendChild(jquery)
    })
    $("#testframe").replaceWith(newTestFrame)
    return wait.until(
        function() {
          return predicate()
        },
        testTimeoutPageLoad
    )().then(function() {
        window.uiError = null
        testFrame().onerror = function(err) { window.uiError = err; } // Hack: force mocha to fail on unhandled exceptions
    })
  }
}

function takeScreenshot() {
  if (window.callPhantom) {
    var date = new Date()
    var filename = "target/screenshots/" + date.getTime()
    console.log("Taking screenshot " + filename)
    callPhantom({'screenshot': filename})
  }
}

(function improveMocha() {
  var origBefore = before
  before = function() {
    Array.prototype.slice.call(arguments).forEach(function(arg) {
      if (typeof arg !== "function") {
        throw ("not a function: " + arg)
      }
      origBefore(arg)
    })
  }
})()
