(ns oph.va.admin-ui.router)

(defn- split-param [param]
  (let [[k v] (.split param "=")]
    {(keyword k) v}))

(defn- split-params [params]
  (map split-param params))

(defn- merge-params [params]
  (reduce conj params))

(defn get-current-hostname []
  (-> js/window
      (.-location)
      (.-hostname)))

(defn get-current-path []
  (-> js/window
      (.-location)
      (.-pathname)))

(defn get-current-query []
  (-> js/window
      (.-location)
      (.-search)
      (.replace "?" "")))

(defn add-to-history! [path]
  (-> js/window
      (.-history)
      (.pushState "" "" path)))

(defn get-param [query param]
  (when (seq query)
    (-> (.split query "&")
        (js->clj)
        (split-params)
        (merge-params)
        (get param))))

(defn query->str [query]
  (clojure.string/join
    "&" (map #(str (name (first %)) "=" (second %)) query)))

(defn set-query! [query-map]
  (-> js/window
      (.-history)
      (.pushState nil "" (str "?" (query->str query-map)))))

(defn redirect-to! [url]
  (-> js/window
      .-location
      .-href
      (set! url)))

(defn get-current-param [param]
  (get-param (get-current-query) param))
