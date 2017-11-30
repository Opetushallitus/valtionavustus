(ns va-payments-ui.connection
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [cljs-http.client :as http]
            [cljs.core.async :refer [<!]]
            [goog.net.cookies]
            [va-payments-ui.utils :refer [format]]))

(goog-define backend-url "http://localhost")

(goog-define service "http://localhost/login/cas")

(goog-define login-url "https://testi.virkailija.opintopolku.fi/cas/login")

(def login-url-with-service (format "%s?service=%s" login-url service))

(def api-path "api/v2")

(defn get-grant-data [id]
  (http/get (format "%s/%s/grants/%d/" backend-url api-path id)
            {:with-credentials? true}))

(defn get-grant-applications [id]
  (http/get (format "%s/%s/grants/%d/applications/?template=with-evaluation"
                    backend-url api-path id)
            {:with-credentials? true}))

(defn get-grants-list []
  (http/get (format "%s/%s/grants/?template=with-content" backend-url api-path)
            {:with-credentials? true}))

(defn get-grant-payments [id]
    (http/get (format "%s/%s/grants/%d/payments/" backend-url api-path id)
            {:with-credentials? true}))

(defn get-next-installment-number []
    (http/get (format "%s/%s/payments/next-installment-number/"
                      backend-url api-path)
            {:with-credentials? true}))

(defn create-application-payment [id values]
  (http/post (format "%s/%s/applications/%s/payments/" backend-url api-path id)
             {:json-params values
              :with-credentials? true}))

(defn update-payment [payment]
  (http/put (format "%s/%s/payments/%d/" backend-url api-path (:id payment))
             {:json-params payment
              :with-credentials? true}))

(defn create-grant-payments [id payments]
  (http/post (str backend-url "/api/avustushaku/" id "/payments")
             {:json-params payments
              :with-credentials? true}))

(defn send-payments-email [id]
  (http/post (format
               "%s/api/avustushaku/%d/payments-email/" backend-url id)
             {:json-params {}
              :with-credentials? true}))

(defn check-session []
  (http/get (format "%s/login/sessions/" backend-url)
            {:with-credentials? true}))


