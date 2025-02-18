(ns oph.va.hakija.officer-edit-auth
  (:require [buddy.auth.backends.token :refer [jws-backend]]
            [clojure.tools.trace :refer [trace]]
            [buddy.sign.jwt :refer [sign]]
            [clj-time.core :as time]
            [oph.soresu.common.config :refer [config]]))

(def secret (:officer-edit-jwt-secret config))

(def officer-edit-auth-backend (jws-backend {:secret secret}))

(def officer-edit-scope "officer-edit")

(defn generate-token [hakemus-id]
  (sign {:scope officer-edit-scope
         :hakemus-id hakemus-id
         :iat (time/now)
         :exp (time/plus (time/now) (time/hours 8))}
        secret))

(defn hakemus-update-authorized? [{scope :scope token-hakemus-id :hakemus-id} hakemus-id]
  (and (= scope officer-edit-scope)
       (= token-hakemus-id hakemus-id)))