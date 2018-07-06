(ns oph.common.email-utils
  (:require [ring.util.codec :refer [form-encode]]))

(defn url-generator [va-url avustushaku-id user-key lang token type]
  (let [lang-str (or (clojure.core/name lang) "fi")
        refuse (= type "refuse") 
        modify (= type "modify")
        url-parameters  (form-encode {:avustushaku avustushaku-id :hakemus user-key :lang lang-str :preview true :token token :refuse-grant refuse :modify-application modify})]
(str va-url "avustushaku/" avustushaku-id "/nayta?" url-parameters)))

 (defn modify-url [va-url avustushaku-id user-key lang token]
  (url-generator va-url avustushaku-id user-key lang token "modify"))
  
  (defn refuse-url [va-url avustushaku-id user-key lang token]
    (url-generator va-url avustushaku-id user-key lang token "refuse"))