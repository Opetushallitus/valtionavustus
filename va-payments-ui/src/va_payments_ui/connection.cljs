(ns va-payments-ui.connection
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [cljs-http.client :as http]
            [cljs.core.async :refer [<!]]
            [goog.net.cookies]
            [va-payments-ui.utils :refer [format]]))

(def api-path "api/v2")

(defonce config (atom {}))

(defn login-url-with-service []
  (format "%s?service=%s/login/cas"
          (get-in config [:opintopolku :url])
          (get-in config [:virkailija-server :url])))

(defn get-grant-data [id]
  (http/get (format "/%s/grants/%d/" api-path id)
            {:with-credentials? true}))

(defn get-grant-applications [id]
  (http/get (format "/%s/grants/%d/applications/?template=with-evaluation"
                    api-path id)
            {:with-credentials? true}))

(defn get-grants-list []
  (http/get (format "/%s/grants/?template=with-content" api-path)
            {:with-credentials? true}))

(defn get-grant-payments [id]
  (http/get (format "/%s/grants/%d/payments/" api-path id)
            {:with-credentials? true}))

(defn create-application-payment [id values]
  (http/post (format "/%s/applications/%s/payments/" api-path id)
             {:json-params values
              :with-credentials? true}))

(defn update-payment [payment]
  (http/put (format "/%s/payments/%d/" api-path (:id payment))
            {:json-params payment
             :with-credentials? true}))

(defn create-grant-payments [id payments]
  (http/post (str "/api/avustushaku/" id "/payments")
             {:json-params payments
              :with-credentials? true}))

(defn send-payments-email [id]
  (http/post (format
              "/api/avustushaku/%d/payments-email/" id)
             {:json-params {}
              :with-credentials? true}))

(defn get-payment-history [id]
  (http/get (format "/%s/applications/%d/payments-history/" api-path id)))

(defn delete-grant-payments [id]
  (http/delete (format "/%s/grants/%d/payments/" api-path id)))

(defn get-grant-roles [id]
  (http/get (format "/%s/grants/%d/roles/" api-path id)
            {:with-credentials? true}))

(defn check-session []
  (http/get (format "/login/sessions/")
            {:with-credentials? true}))

(defn send-xml-invoice [payment]
  (http/post (format "/%s/payments/%d/invoice/" api-path (:id payment))
             {:json-params {}
              :with-credentials? true}))

(defn get-config []
  (http/get (format "/environment")
            {:with-credentials? true}))

(defn get-user-info []
  (http/get (format "/api/userinfo/")
            {:with-credentials? true}))

(defn set-config! [c]
  (reset! config c))
