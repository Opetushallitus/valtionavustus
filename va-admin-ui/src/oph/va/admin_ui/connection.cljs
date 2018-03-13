(ns oph.va.admin-ui.connection
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [cljs.core.async :refer [<! chan]]
            [cljs-http.client :as http]
            [goog.net.cookies]
            [oph.va.admin-ui.payments.utils :refer [format]]))

(def ^:private api-path "api/v2")

(defonce ^:private cache (atom {}))

(defonce ^:private config (atom {}))

(defn get-cached
  [url]
  (let [c (chan)
        cached-result (get @cache url)]
    (go (if (nil? cached-result)
          (let [result (<! (http/get url {:with-credentials? true}))]
            (when (:success result)
              (swap! cache assoc url (assoc result :cached true)))
            (>! c result))
          (>! c cached-result)))
    c))

(defn remove-cached! [path]
  (apply swap! cache dissoc (filter #(> (.indexOf % path) -1) (keys @cache))))

(defn login-url-with-service
  []
  (format "%s?service=%s/login/cas"
          (get-in config [:opintopolku :url])
          (get-in config [:virkailija-server :url])))

(defn get-grant-data
  [id]
  (http/get (format "/%s/grants/%d/" api-path id) {:with-credentials? true}))

(defn get-grant-applications
  [id]
  (get-cached (format "/%s/grants/%d/applications/?template=with-evaluation"
                      api-path
                      id)))

(defn get-grants
  []
  (http/get (format "/%s/grants/?template=with-content" api-path)
            {:with-credentials? true}))

(defn get-grant-payments
  [id]
  (http/get (format "/%s/grants/%d/payments/" api-path id)
            {:with-credentials? true}))

(defn create-payment
  [values]
  (http/post (format "/%s/payments/" api-path)
             {:json-params values :with-credentials? true}))

(defn update-payment
  [payment]
  (http/put (format "/%s/payments/%d/" api-path (:id payment))
            {:json-params payment :with-credentials? true}))

(defn send-payments-email
  [id data]
  (http/post (format "/%s/grants/%d/payments-email/" api-path id)
             {:json-params data :with-credentials? true}))

(defn get-payment-history
  [id]
  (http/get (format "/%s/applications/%d/payments-history/" api-path id)))

(defn delete-grant-payments
  [id]
  (http/delete (format "/%s/grants/%d/payments/" api-path id)))

(defn get-config
  []
  (http/get (format "/environment") {:with-credentials? true}))

(defn get-user-info
  []
  (http/get (format "/api/userinfo/") {:with-credentials? true}))

(defn find-payment-batch [grant-id date]
  (http/get (format "/%s/payment-batches/?grant-id=%d&date=%s"
                    api-path grant-id date)
            {:with-credentials? true}))

(defn create-payment-batch [data]
  (http/post (format "/%s/payment-batches/" api-path)
             {:json-params data :with-credentials? true}))

(defn create-batch-payments [id]
  (http/post (format "/%s/payment-batches/%d/payments/" api-path id)
             {:with-credentials? true}))

(defn get-va-code-values-by-type [value-type]
  (get-cached (format "/%s/va-code-values?value-type=%s"
                    api-path value-type)))

(defn get-va-code-values-by-type-and-year [value-type year]
  (get-cached (format "/%s/va-code-values?value-type=%s&year=%d"
                    api-path value-type year)))

(defn create-va-code-value [values]
  (http/post (format "/%s/va-code-values/" api-path)
             {:with-credentials? true
              :json-params values}))

(defn delete-va-code-value [id]
  (http/delete (format "/%s/va-code-values/%d/" api-path id)
               {:with-credentials? true}))

(defn get-reports []
  (get-cached (str "/" api-path "/reports/")))

(defn set-config! [c] (reset! config c))

(defn delete-payments? [] (get-in @config [:payments :delete-payments?]))
