(ns oph.va.admin-ui.payments.applications
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.reagent :as ui]
            [cljs-react-material-ui.icons :as ic]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.utils :refer [format]]))

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

(defn render-application [i application on-info-clicked is-admin?]
  [ui/table-row {:key i :style (when (odd? i) theme/striped-row)}
   [ui/table-row-column
    (state-to-str (:state (last (:payments application))))]
   [ui/table-row-column {:title (:organization-name application)}
    (:organization-name application)]
   [ui/table-row-column
    [:a
     {:target "_blank"
      :title (:project-name application)
      :href (format "/avustushaku/%d/hakemus/%d/arviointi/"
                    (:grant-id application)
                    (:id application))} (:project-name application)]]
   [ui/table-row-column
    (.toLocaleString (get application :budget-granted)) " €"]
   [ui/table-row-column (get-answer-value (:answers application) "bank-iban")]
   [ui/table-row-column {:style {:text-align "right"}} (get application :register-number)]
   [ui/table-row-column (get application :lkp-account)]
   [ui/table-row-column (get application :takp-account)]
   [ui/table-row-column
    (.toLocaleString (get application :total-paid)) " €"]
   (when is-admin?
     [ui/table-row-column
    [ui/icon-button {:on-click #(on-info-clicked (:id application))}
       [ic/action-info-outline]]])])

(defn applications-table [{:keys [applications on-info-clicked is-admin?]}]
  [:div
   [ui/table {:fixed-header true :selectable false :body-style theme/table-body}
    [ui/table-header {:adjust-for-checkbox false :display-select-all false}
     [ui/table-row
      [ui/table-header-column "Tila"]
      [ui/table-header-column "Toimittajan nimi"]
      [ui/table-header-column "Hanke"]
      [ui/table-header-column "Myönnetty summa"] [ui/table-header-column "IBAN"]
      [ui/table-header-column {:style {:text-align "right"}} "Pitkäviite"]
      [ui/table-header-column "LKP-tili"]
      [ui/table-header-column "TaKp-tili"]
      [ui/table-header-column "Maksettu"]
      (when is-admin? [ui/table-header-column "Lisätietoja"])]]
    [ui/table-body {:display-row-checkbox false}
     (doall (map-indexed #(render-application %1 %2 on-info-clicked is-admin?)
                         applications))]
    [ui/table-footer {:adjust-for-checkbox false}
     [ui/table-row
      [ui/table-row-column]
      [ui/table-row-column]
      [ui/table-row-column "Yhteensä"]
      [ui/table-row-column
       (.toLocaleString (reduce #(+ %1 (:budget-granted %2)) 0 applications))
       " €"]
      [ui/table-row-column]
      [ui/table-row-column]
      [ui/table-row-column]
      [ui/table-row-column]
      [ui/table-row-column]
      (when is-admin? [ui/table-row-column])]]]])
