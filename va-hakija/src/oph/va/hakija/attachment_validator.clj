(ns oph.va.hakija.attachment-validator
  (:require [clojure.string :as str]
            [pantomime.mime :as mime]
            [oph.soresu.common.config :refer [config]]))

(def allowed-mime-types (-> config :server :attachment-mime-types))

(defn validate-file-content-type [file provided-content-type]
  (let [detected-content-type (mime/mime-type-of file)]
    (if (some #{detected-content-type} allowed-mime-types)
      {:provided-content-type provided-content-type
       :detected-content-type detected-content-type
       :allowed?              true}
      {:provided-content-type provided-content-type
       :detected-content-type detected-content-type
       :allowed?              false
       :allowed-content-types allowed-mime-types})))

(defn file-name-according-to-content-type [filename content-type]
  (let [file-extension (mime/extension-for-name content-type)]
    (if (or (str/blank? file-extension) (.endsWith (.toLowerCase filename) file-extension))
      filename
      (str filename file-extension))))
