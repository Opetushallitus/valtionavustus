(ns oph.va.admin-ui.va-code-values.va-code-values-core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [cljs.core.async :refer [<! put! close!]]
   [reagent.core :as r]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [color]]
   [oph.va.admin-ui.components.ui :as va-ui]
   [cljs-react-material-ui.reagent :as ui]
   [cljs-react-material-ui.icons :as ic]
   [oph.va.admin-ui.theme :as theme]
   [oph.va.admin-ui.connection :as connection]
   [oph.va.admin-ui.dialogs :as dialogs]))

(defonce code-values (r/atom []))

(defonce code-filter (r/atom {}))

(def value-types {:operational-unit "Toimintayksikkö"
                  :project "Projekti"
                  :operation "Toiminto"})

(def years (mapv #(hash-map :primary-text % :value %) (range 2018 2038)))

(defn render-code-table [values]
  [ui/table {:fixed-header true :selectable false :body-style theme/table-body}
   [ui/table-header {:adjust-for-checkbox false :display-select-all false}
    [ui/table-row
     [ui/table-header-column "Vuosi"]
     [ui/table-header-column "Koodi"]
     [ui/table-header-column "Nimi"]
     [ui/table-header-column "Toiminnot"]]]
   [ui/table-body {:display-row-checkbox false}
    (doall
      (map-indexed
        (fn [i row]
          [ui/table-row {:key i}
           [ui/table-row-column (:year row)]
           [ui/table-row-column (:code row)]
           [ui/table-row-column (:code-value row)]
           [ui/table-row-column
            [ui/icon-button {:on-click #(prn row)}
             [ic/action-delete {:color "gray"}]]]])
        values))]])

(defn create-catch-enter [f]
  (fn [e]
    (when (= (.-key e) "Enter")
      (f))))

(defn is-valid? [m]
  (and (= (count m) 3)
       (not-any? empty?
                 (->> m
                      vals
                      (map str)))))

(defn render-add-item [on-change]
  (let [v (r/atom {})
        on-submit
        (fn []
          (when (is-valid? @v)
            (do (on-change @v)
                (reset! v {}))))
        catch-enter (create-catch-enter on-submit)]
    (fn [on-change]
      [:div {:style {:max-width 1000}}
       [:div {:style {:display "inline"}}
        [va-ui/text-field
         {:floating-label-text "Vuosi"
          :value (or (:year @v) "")
          :type "number"
          :max-length 4
          :on-change
          (fn [e]
            (let [result (js/parseInt (.-value (.-target e)))]
              (swap! v assoc :year
                     (if (js/isNaN result)
                       ""
                       result))))
          :style (assoc theme/text-field :width 75)
          :on-key-press catch-enter}]
        [va-ui/text-field
         {:floating-label-text "Koodi"
          :value (or (:code @v) "")
          :on-change #(swap! v assoc :code (.-value (.-target %)))
          :style (assoc theme/text-field :width 100)
          :on-key-press catch-enter}]
        [va-ui/text-field
         {:floating-label-text "Nimi"
          :value (or (:code-value @v) "")
          :on-change #(swap! v assoc :code-value (.-value (.-target %)))
          :style (assoc theme/text-field :width 350)
          :on-key-press catch-enter}]]
       [va-ui/raised-button
        {:label "Lisää"
         :primary true
         :disabled (not (is-valid? @v))
         :on-click on-submit}]])))

(defn render-filter [values on-change]
  [:div
   [va-ui/text-field {:value (or (:code values) "")
                      :on-change #(on-change :code %)}]])

(defn download-items! [value-type year]
  (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan koodeja" 3)]
      (put! dialog-chan 1)
      (let [result
            (<! (connection/get-va-code-values-by-type (name value-type) year))]
        (if (:success result)
          (reset! code-values (:body result))
          (dialogs/show-error-message!
            "Virhe koodien latauksessa"
            (select-keys result [:status :error-text]))))
      (put! dialog-chan 2)
      (close! dialog-chan))))

(defn create-item! [value-type values]
  (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Lähetetään tietoja" 3)]
      (put! dialog-chan 1)
      (let [result (<! (connection/create-va-code-value
                         (assoc values :value-type (name value-type))))]
        (put! dialog-chan 2)
        (if (:success result)
          (swap! code-values conj (:body result))
          (dialogs/show-error-message!
            "Virhe koodin lisäämisessä"
            (select-keys result [:status :error-text]))))
      (close! dialog-chan))))

(defn current-year []
  (.getFullYear (js/Date.)))

(defn home-page []
  [:div
   [:div {:class "oph-typography"}
    [:div {:class "oph-tabs" :style theme/tabs-header}
     (doall
       (map-indexed
         (fn [i [k v]]
           [:a {:key i
                :style theme/tab-header-link
                :on-click (fn [_]
                            (reset! code-values [])
                            (swap! code-filter assoc :value-type k
                                   :year (current-year)))
                :class
                (str "oph-tab-item"
                     (when (= (:value-type @code-filter) k) " oph-tab-item-is-active"))}
            v])
         value-types))]]
   [:div
    [(render-add-item #(create-item! (:value-type @code-filter) %))]
    [:hr]
    [:div
     (va-ui/select-field
       {:value (:year @code-filter)
        :on-change #(swap! code-filter assoc :year (js/parseInt %))
        :values years})]
    (render-code-table @code-values)]])

(defn init! []
  (add-watch code-filter ""
             #(download-items! (:value-type %4) (:year %4)))
  (reset! code-filter {:value-type :operational-unit
                       :year (current-year)}))
