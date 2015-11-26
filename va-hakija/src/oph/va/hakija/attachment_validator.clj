(ns oph.va.hakija.attachment-validator
  (:require [clojure.tools.logging :as log]
            [ring.util.http-response :as http-response]
            [pantomime.mime :as mime]
            [oph.soresu.common.config :refer [config]]))

(def allowed-mime-types (-> config :server :attachment-mime-types))

(defn- validate-content-type [real-content-type provided-content-type]
  (if (not-any? (partial = real-content-type) allowed-mime-types)
    (do
      (log/warn "Request with illegal content-type'" real-content-type "'(provided'" provided-content-type "'). Allowed:" allowed-mime-types)
      (http-response/bad-request! {:provided-content-type provided-content-type
                                   :illegal-content-type real-content-type
                                   :allowed-content-types allowed-mime-types}))))

(defn validate-file [file filename provided-content-type]
  (let [real-content-type (mime/mime-type-of file)]
    (validate-content-type real-content-type provided-content-type)
    real-content-type))
