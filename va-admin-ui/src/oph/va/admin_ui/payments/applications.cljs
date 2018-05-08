(ns oph.va.admin-ui.payments.applications
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.reagent :as ui]
            [cljs-react-material-ui.icons :as ic]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.utils :refer [format]]
            [oph.va.admin-ui.components.ui :as va-ui]))

(def str-limit 30)

(defn get-answer-value [answers key]
  (:value (first (filter #(= (:key %) key) answers))))

(defn state-to-str [state]
  (case state
    0 "Luotu"
    1 "Hyväksytty"
    2 "Lähetetty Rondoon"
    3 "Maksettu"
    4 "Epäonnistunut"
    "Odottaa maksatusta"))

(defn render-application-row [application on-info-clicked]
  [[:span {:style {:text-align "right"}} (get application :register-number)]
   (state-to-str (:state (last (:payments application))))
   [:span {:title (:organization-name application)}
    (:organization-name application)]
   [:a
     {:target "_blank"
      :title (:project-name application)
      :href (format "/avustushaku/%d/hakemus/%d/arviointi/"
                    (:grant-id application)
                    (:id application))}
    [:span {:title (:project-name application)}
     (:project-name application)]]
   [{:style {:text-align "right"}}
    [:span(.toLocaleString (get application :budget-granted 0)) " €"]]
   (get-answer-value (:answers application) "bank-iban")
   (get application :lkp-account)
   (get application :takp-account)
   [{:style {:text-align "right"}}
    [:span (.toLocaleString (get application :budget-granted 0)) " €"]]
   (when (not (nil? on-info-clicked))
     [ui/icon-button {:on-click #(on-info-clicked (:id application))}
      [ic/action-info-outline]])])

(def header
  [[:span {:style {:text-align "right"}} "Pitkäviite"] "Tila" "Toimittajan nimi"
   "Hanke" [:span {:style {:text-align "right"}} "Maksuun"] "IBAN" "LKP-tili"
   "TaKp-tili" [:span {:style {:text-align "right"}} "Tiliöinti"] "Lisätietoja"])

(defn applications-table [{:keys [applications on-info-clicked is-admin?]}]
  [va-ui/table
   {:empty-text "Ei maksatuksia."}
   (if is-admin? header (butlast header))
   (map
     #(render-application-row % (when is-admin? on-info-clicked))
     applications)
   ["" "" "" ""
    [{:style {:text-align "right"}}
     [:span
      (.toLocaleString (reduce #(+ %1 (:budget-granted %2)) 0 applications))
      " €"]]
    "" "" ""
    [{:style {:text-align "right"}}
     [:span
      (.toLocaleString (reduce #(+ %1 (:budget-granted %2)) 0 applications))
      " €"]]]])
