(ns oph.va.admin-ui.search.search-core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [reagent.core :as r]
   [cljs.core.async :refer [put! <! close!]]
   [oph.va.admin-ui.components.ui :as va-ui]
   [oph.va.admin-ui.theme :as theme]
   [oph.va.admin-ui.payments.utils :refer [to-simple-date-time]]
   [oph.va.admin-ui.connection :as connection]))

(defonce search-results
  {:grants (r/atom [])
   :applications (r/atom [])})

(defonce state
  (r/atom {:grants-searching false :applications-searching false}))

(def max-str-len 60)

(defn shrink [s]
  (if (> (count s) (- max-str-len 3))
    (str (subs s 0 max-str-len) "...")
    s))

(defn search-items [term]
  (go
    (let [result (<! (connection/find-grants term))]
      (if (:success result)
        (reset! (:grants search-results) (:body result)))))
  (go
    (let [result (<! (connection/find-applications term))]
      (if (:success result)
        (reset! (:applications search-results) (:body result))))))

(defn render-result-item [i link title content]
  [:div {:key i}
   [:h3
    [:a {:href link}
     [:span {:class "search-result-title"}
      (shrink title)]]]
   [:div content]])

(defn format-title [grant]
  (str (when (not (empty? (:register-number grant)))
         (str (:register-number grant) " - "))
       (get-in grant [:content :name :fi])))

(defn render-grant [i grant]
  (render-result-item
    i
    (str "/avustushaku/" (:id grant) "/")
    (format-title grant)
    (str (to-simple-date-time (get-in grant [:content :duration :start]))
         " - "
         (to-simple-date-time (get-in grant [:content :duration :end])))))

(defn render-application [i application]
  (render-result-item
    i
    (str "/avustushaku/"
         (:grant-id application) "/hakemus/" (:id application) "/")
    (str (get application :register-number)
         " - "
         (:organization-name application))
    (:project-name application)))

(defn render-search-results [results title renderer]
  [:div
   [:h2 title]
   (if (> (count results) 0)
     (doall (map-indexed renderer results))
     [:span "Ei hakutuloksia"])])

(defn home-page []
  [:div
   [(let [search-term (r/atom "")]
      (fn []
        [:div
         [va-ui/text-field
          {:on-change #(reset! search-term (-> % .-target .-value))
           :on-enter-pressed #(search-items @search-term)
           :style (assoc theme/text-field :width 575)}]]))]
   [(fn []
      (render-search-results
        (deref (:grants search-results))
        "Avustushaut"
        render-grant))]
   [(fn []
      (render-search-results
        (deref (:applications search-results))
        "Hakemukset"
        render-application))]])


(defn init! [])
