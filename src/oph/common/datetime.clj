(ns oph.common.datetime
  (:require [clj-time.core :as clj-time]
            [clj-time.format :as clj-time-format]))

(defn local-time-zone []
  (clj-time/time-zone-for-id "Europe/Helsinki"))

(defn date-string [date]
  (.print (clj-time-format/formatter "dd.MM.YYYY" (local-time-zone)) date))

(defn time-string [date]
  (.print (clj-time-format/formatter "HH.mm" (local-time-zone)) date))

(defn parse [ISO8601-timestamp-string]
  (clj-time-format/parse (clj-time-format/formatters :date-time) ISO8601-timestamp-string))