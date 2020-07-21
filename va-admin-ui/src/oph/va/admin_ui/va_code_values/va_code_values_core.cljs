(ns oph.va.admin-ui.va-code-values.va-code-values-core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [cljs.core.async :refer [<! put! close!]]
   [reagent.core :as r]
   [cljsjs.material-ui]
   [oph.va.admin-ui.components.ui :as va-ui]
   [cljs-react-material-ui.reagent :as ui]
   [cljs-react-material-ui.icons :as ic]
   [oph.va.admin-ui.theme :as theme]
   [oph.va.admin-ui.connection :as connection]
   [oph.va.admin-ui.dialogs :as dialogs]
   [oph.va.admin-ui.utils :refer [parse-int]]))

(def ^:private value-types {:operational-unit "Toimintayksikkö"
                  :project "Projekti"
                  :operation "Toiminto"})

(def ^:private years
  (mapv #(hash-map :primary-text % :value %) (range 2018 2038)))

(defonce ^:private state
  {:code-values (r/atom [])
   :code-filter (r/atom {})})

(defn- delete-code! [id code-values]
  (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Poistetaan koodia" 3)]
      (put! dialog-chan 1)
      (let [result
            (<! (connection/delete-va-code-value id))]
        (cond
          (:success result)
          (do
            (reset! code-values (filter #(not= (:id %) id) @code-values))
            (connection/remove-cached! "va-code-values")
            (dialogs/show-message! "Koodi poistettu"))
          (= (:status result) 405)
          (dialogs/show-message!
            "Koodi on käytössä joten sitä ei voi poistaa")
          :else
          (dialogs/show-error-message!
            "Virhe koodin poistamisessa"
            (select-keys result [:status :error-text]))))
      (put! dialog-chan 2)
      (close! dialog-chan))))

(defn toggle-hidden [id code-value]
  (if (= id (:id code-value))
      (assoc code-value :hidden (not (:hidden code-value)))
      code-value))

(defn- hide-code! [id hide code-values]
  (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Asetetaan koodin näkyvyys" 3)]
      (put! dialog-chan 1)
      (let [result
            (<! (connection/hide-va-code-value id hide))]
        (cond
          (:success result)
          (do
            (reset! code-values (map (partial toggle-hidden id) @code-values))
            (connection/remove-cached! "va-code-values")
            (dialogs/show-message! "Koodi muutettu"))
          :else
          (dialogs/show-error-message!
            "Virhe koodin näkyvyyden asettamisessa"
            (select-keys result [:status :error-text]))))
      (put! dialog-chan 2)
      (close! dialog-chan))))

(defn- render-code-table [values on-delete on-hide]
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
          [ui/table-row
           {:key i
            :style (if (:hidden row)
                       theme/hidden)
            :data-test-id (:code row)}
           [ui/table-row-column (:year row)]
           [ui/table-row-column (:code row)]
           [ui/table-row-column (:code-value row)]
           [ui/table-row-column
            [ui/icon-button
             {:on-click
              (fn [_]
                (when (js/confirm "Oletko varma, että halut poistaa koodin?")
                  (on-delete (:id row))))}
             [ic/action-delete {:color "gray"}]]
            (if (:hidden row)
             [ui/icon-button
              {:on-click (fn [_] (on-hide (:id row) false))
               :data-test-id "code-row__show-button"}
              [ic/action-visibility {:color "gray"}]]
             [ui/icon-button
              {:style theme/disabled}
              [ic/action-visibility {:color "gray"}]])
            (if (:hidden row)
             [ui/icon-button
              {:style theme/disabled}
              [ic/action-visibility-off {:color "gray"}]]
             [ui/icon-button
              {:on-click (fn [_] (on-hide (:id row) true))
               :data-test-id "code-row__hide-button"}
              [ic/action-visibility-off {:color "gray"}]])]])
        values))]])

(defn- create-catch-enter [f]
  (fn [e]
    (when (= (.-key e) "Enter")
      (f))))

(defn- is-valid? [m]
  (and (= (count m) 3)
       (not-any? empty?
                 (->> m
                      vals
                      (map str)))))

(defn- render-add-item [on-change]
  (let [v (r/atom {})
        on-submit
        (fn []
          (when (is-valid? @v)
            (on-change @v)
            (reset! v {})))
        catch-enter (create-catch-enter on-submit)]
    (fn [on-change]
      [:div {:style {:max-width 1000}}
       [:div {:style {:display "inline"}}
        [va-ui/text-field
         {:floating-label-text "Vuosi"
          :value (or (:year @v) "")
          :type "number"
          :max-length 4
          :validator #(< (parse-int (-> % .-target .-value)) 2100)
          :on-change
          (fn [e]
            (let [result (js/parseInt (.-value (.-target e)))]
              (swap! v assoc :year
                     (if (js/isNaN result)
                       ""
                       result))))
          :style (assoc theme/text-field :width 75)
          :on-key-press catch-enter
          :data-test-id "code-form__year"}]
        [va-ui/text-field
         {:floating-label-text "Koodi"
          :value (or (:code @v) "")
          :validator #(<= (-> % .-target .-value .-length) 13)
          :on-change #(swap! v assoc :code (.-value (.-target %)))
          :style (assoc theme/text-field :width 150)
          :on-key-press catch-enter
          :data-test-id "code-form__code"}]
        [va-ui/text-field
         {:floating-label-text "Nimi"
          :value (or (:code-value @v) "")
          :on-change #(swap! v assoc :code-value (.-value (.-target %)))
          :style (assoc theme/text-field :width 350)
          :on-key-press catch-enter
          :data-test-id "code-form__name"}]]
       [va-ui/raised-button
        {:label "Lisää"
         :primary true
         :disabled (not (is-valid? @v))
         :on-click on-submit
         :data-test-id "code-form__add-button"}]])))

(defn- download-items! [value-type year code-values]
  (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan koodeja" 3)]
      (put! dialog-chan 1)
      (let [result
            (if (some? year)
              (<! (connection/get-va-code-values-by-type-and-year
                    (name value-type) year))
              (<! (connection/get-va-code-values-by-type (name value-type))))]
        (if (:success result)
          (reset! code-values (:body result))
          (dialogs/show-error-message!
            "Virhe koodien latauksessa"
            (select-keys result [:status :error-text]))))
      (put! dialog-chan 2)
      (close! dialog-chan))))

(defn- create-item! [value-type values code-values]
  (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Lähetetään tietoja" 3)]
      (put! dialog-chan 1)
      (let [result (<! (connection/create-va-code-value
                         (assoc values :value-type (name value-type))))]
        (put! dialog-chan 2)
        (if (:success result)
          (do
            (swap! code-values conj (:body result))
            (connection/remove-cached! "va-code-values"))
          (dialogs/show-error-message!
            "Virhe koodin lisäämisessä"
            (select-keys result [:status :error-text]))))
      (close! dialog-chan))))

(defn- current-year []
  (.getFullYear (js/Date.)))

(defn- lower-str-contains? [s substr]
  (-> s
      .toLowerCase
      (.indexOf substr)
      (not= -1)))

(defn- code-value-matches? [s v]
  (or (lower-str-contains? (:code v) s)
      (lower-str-contains? (:code-value v) s)))

(defn home-page []
  (let [{:keys [code-values code-filter]} state]
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
                              (swap! code-filter assoc :value-type k))
                  :class
                  (str "oph-tab-item"
                       (when (= (:value-type @code-filter) k)
                         " oph-tab-item-is-active"))}
              v])
           value-types))]]
     [:div
      [(render-add-item #(create-item!
                           (:value-type @code-filter) % code-values))]
      [:hr]
      [(let [filter-str (r/atom "")]
         (fn []
           [:div
            [:div
             (va-ui/select-field
               {:value (:year @code-filter)
                :on-change #(swap! code-filter assoc :year (parse-int %))
                :values years
                :include-empty? true})
             (va-ui/text-field
               {:value @filter-str
                :on-change #(reset! filter-str (.-value (.-target %)))})]
            (render-code-table
              (if (empty? @filter-str)
                @code-values
                (filter #(code-value-matches? (.toLowerCase @filter-str) %)
                        @code-values))
              #(delete-code! % code-values)
              #(hide-code! %1 %2 code-values))]))]]]))

(defn init! []
  (add-watch (:code-filter state) ""
             #(download-items!
                (:value-type %4) (:year %4) (:code-values state)))
  (reset! (:code-filter state)
          {:value-type :operational-unit
           :year nil}))
