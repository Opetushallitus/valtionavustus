(ns oph.va.hakija.attachment-validator
  (:require [clojure.string :as str]
            [clojure.tools.logging :as log]
            [ring.util.http-response :as http-response]
            [pantomime.mime :as mime]
            [oph.soresu.common.config :refer [config]]))

(def allowed-mime-types (-> config :server :attachment-mime-types))

(defn validate-file-content-type [file filename provided-content-type]
  (let [real-content-type (mime/mime-type-of file)]
    (if (not-any? (partial = real-content-type) allowed-mime-types)
      (do
        (log/warn (str "Request with illegal content-type '" real-content-type "' of file '" filename "' (provided '" provided-content-type "' ). Allowed: " allowed-mime-types)
        (http-response/bad-request! {:provided-content-type provided-content-type
                                     :illegal-content-type real-content-type
                                     :allowed-content-types allowed-mime-types})))
      real-content-type)))

(defn file-name-according-to-content-type [filename real-content-type]
  (let [file-extension (mime/extension-for-name real-content-type)]
    (if (or (str/blank? file-extension) (.endsWith (.toLowerCase filename) file-extension))
      filename
      (let [fixed-filename (str filename file-extension)]
        (log/warn (str "Request with filename '" filename "' has wrong extension for it's content-type '" real-content-type "'. Renaming to '" fixed-filename "'"))
        fixed-filename))))
