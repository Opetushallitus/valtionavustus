(ns oph.common.email-utils)

(defn refuse-url [va-url avustushaku-id user-key lang token]
   (let [lang-str (or (clojure.core/name lang) "fi")]
     (str va-url "avustushaku/" avustushaku-id "/nayta?avustushaku=" avustushaku-id
          "&hakemus=" user-key "&lang=" lang-str "&preview=true&token=" token "&refuse-grant=true")))

          