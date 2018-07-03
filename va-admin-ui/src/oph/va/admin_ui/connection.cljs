(ns oph.va.admin-ui.connection
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [cljs.core.async :refer [<! chan]]
            [cljs-http.client :as http]
            [goog.net.cookies]
            [oph.va.admin-ui.utils :refer [format]]))

(def ^:private api-path "api/v2")

(defonce ^:private cache (atom {}))

(defonce ^:private config (atom {}))

(defn- get-cached [url]
  (let [c (chan)
        cached-result (get @cache url)]
    (go (if (nil? cached-result)
          (let [result (<! (http/get url {:with-credentials? true}))]
            (when (:success result)
              (swap! cache assoc url (assoc result :cached true)))
            (>! c result))
          (>! c cached-result)))
    c))

(defn- remove-cached! [path]
  (apply swap! cache dissoc (filter #(> (.indexOf % path) -1) (keys @cache))))

(defn login-url-with-service []
  (format "%s?service=%s/login/cas"
          (get-in config [:opintopolku :url])
          (get-in config [:virkailija-server :url])))

(defn get-grant-applications [id]
  (get-cached (format "/%s/grants/%d/applications/?template=with-evaluation"
                      api-path
                      id)))

(defn get-grants []
  (http/get (format "/%s/grants/?template=with-content" api-path)
            {:with-credentials? true}))

(defn find-grants [term]
  (http/get (format "/%s/grants/?search=%s" api-path term)
             {:with-credentials? true}))

(defn find-applications [term]
  (http/get (format "/%s/applications/?search=%s" api-path term)
            {:with-credentials? true}))

(defn get-grant-payments [id]
  (http/get (format "/%s/grants/%d/payments/" api-path id)
            {:with-credentials? true}))

(defn send-payments-email [id]
  (http/post (format "/%s/payment-batches/%d/payments-email/" api-path id)
             {:with-credentials? true}))

(defn delete-grant-payments [id]
  (http/delete (format "/%s/grants/%d/payments/" api-path id)))

(defn create-grant-payments [id]
  (http/post (format "/%s/grants/%d/payments/" api-path id)
             {:json-params {:phase 0} :with-credentials? true}))

(defn get-config []
  (http/get (format "/environment") {:with-credentials? true}))

(defn get-user-info []
  (http/get (format "/api/userinfo/") {:with-credentials? true}))

(defn find-payment-batches [grant-id date]
  (http/get (format "/%s/payment-batches/?grant-id=%d&date=%s"
                    api-path grant-id date)
            {:with-credentials? true}))

(defn get-batch-documents [batch-id]
  (http/get (format "/%s/payment-batches/%d/documents/" api-path batch-id)
            {:with-credentials? true}))

(defn send-batch-document [batch-id document]
  (http/post (format "/%s/payment-batches/%d/documents/" api-path batch-id)
             {:with-credentials? true
              :json-params document}))

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
               {:with-credentials? true})
  (remove-cached! "/va-code-values/"))

(defn get-reports []
  (get-cached (str "/" api-path "/reports/")))

(defn search-users [term]
  (http/post "/api/va-user/search"
             {:with-credentials? true
              :json-params {:searchInput term}}))

(defn set-config! [c] (reset! config c))

(defn delete-payments? [] (get-in @config [:payments :delete-payments?]))
