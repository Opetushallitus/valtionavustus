(ns oph.common.email-utils
  (:require [ring.util.codec :refer [form-encode]]))

(defn refuse-url [va-url avustushaku-id user-key lang token]
   (let [lang-str (or (clojure.core/name lang) "fi")
        url-parameters  (form-encode {:hakemus user-key :lang lang-str :preview true :token token :refuse-grant true})]
     (str va-url "avustushaku/" avustushaku-id "/nayta?avustushaku=" avustushaku-id url-parameters)))

          