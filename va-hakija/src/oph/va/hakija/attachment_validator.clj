(ns oph.va.hakija.attachment-validator
  (:require [clojure.string :as str]
            [oph.soresu.common.config :refer [config]])
  (:import [org.apache.tika Tika]
           [org.apache.tika.mime MimeTypes MimeTypeException]))

(def allowed-mime-types (-> config :server :attachment-mime-types))

(defn- mime-type-of [file]
  (.detect (new Tika) file))

(defn validate-file-content-type [file provided-content-type]
  (let [detected-content-type (mime-type-of file)]
    (if (some #{detected-content-type} allowed-mime-types)
      {:provided-content-type provided-content-type
       :detected-content-type detected-content-type
       :allowed?              true}
      {:provided-content-type provided-content-type
       :detected-content-type detected-content-type
       :allowed?              false
       :allowed-content-types allowed-mime-types})))

(def default-mime-types (MimeTypes/getDefaultMimeTypes))

(defn- extension-for-name [content-type]
  (try (.getExtension (.forName default-mime-types content-type))
       (catch MimeTypeException _ "")))

(defn file-name-according-to-content-type [filename content-type]
  (let [file-extension (extension-for-name content-type)]
    (if (or (str/blank? file-extension) (.endsWith (.toLowerCase filename) file-extension))
      filename
      (str filename file-extension))))
