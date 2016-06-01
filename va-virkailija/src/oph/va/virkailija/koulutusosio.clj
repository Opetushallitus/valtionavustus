(ns oph.va.virkailija.koulutusosio
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [oph.common.email :as email]
            [oph.soresu.form.formutil :as formutil]
            [schema.core :as s]))

(defn koulutusosio [hakemus answers translate language]
  (let [template (email/load-template "templates/koulutusosio.html")
        koulutusosiot (formutil/find-answer-value answers "koulutusosiot")
        overridden-answers (-> hakemus :arvio :overridden-answers :value)
        params {:t                      translate
                }
        body (render template params)]
    body))