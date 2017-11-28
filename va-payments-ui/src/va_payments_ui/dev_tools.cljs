(ns va-payments-ui.dev-tools
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [cljs-http.client :as http]
            [cljs.core.async :refer [<!]]
            [va-payments-ui.connection :refer [backend-url]]))

(defn get-data [path]
  "Function for testing data connection."
  (go
    (let [response (<! (http/get (str backend-url path) {:with-credentials? true}))]
      (println response))))

(defn post-data [path data]
  "Function for testing data connection."
  (go
    (let [response (<! (http/post (str backend-url path)
                                  {:with-credentials? true
                                   :json-params data}))]
      (println response))))

