(ns oph.va.admin-ui.reports.reports-core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [cljsjs.chartjs]
   [cljs.core.async :refer [put! <! close!]]
   [oph.va.admin-ui.connection :as connection]
   [oph.va.admin-ui.dialogs :as dialogs]
   [reagent.core :as r]))

(def ^:private colors
  {:blue "rgb(54, 162, 235)"
   :green "rgb(75, 192, 192)"
   :orange "rgb(255, 159, 64)"
   :purple "rgb(153, 102, 255)"
   :red "rgb(255, 99, 132)"
   :yellow "rgb(255, 205, 86)"
   :grey "rgb(201, 203, 207)"})

(defonce ^:private data (r/atom {}))

(defonce ^:private grants-data (r/atom {}))

(defn- show-data! [id chart-data]
  (let [context (.getContext (.getElementById js/document id) "2d")]
    (js/Chart. context (clj->js chart-data))))

(defn- create-canvas [id]
  (fn [] [:canvas {:id id :width 1200 :height 380}]))

(defn- gen-budget-data [applications granted]
  {:type "bar"
   :options {:title {:display true :text "Avustukset yhteensä €"}
             :responsive true}
   :data {:labels (mapv :year applications)
          :datasets [{:type "bar"
                      :data (mapv :budget-total applications)
                      :label "Rahoitettavaa yhteensä"
                      :backgroundColor "#90EE90"}
                     {:type "bar"
                      :data (mapv :budget-oph-share applications)
                      :label "Haettu avustus yhteensä"
                      :backgroundColor "#36a2eb"}
                     {:type "bar"
                      :data (mapv :budget-granted granted)
                      :label "Myönnetty avustus yhteensä"
                      :backgroundColor "#a162ff"}
                     {:type "bar"
                      :data (mapv :costs-granted granted)
                      :label "Hyväksytyt kustannukset yhteensä"
                      :backgroundColor "#f9ff61"}]}})

(defn- gen-evaluations-data [applications accepted rejected]
  {:type "bar"
   :options {:title {:display true :text "Hakemukset kpl"}
             :responsive true}
   :data {:labels (mapv :year applications)
          :datasets [{:data (mapv :count applications)
                      :label "Hakemukset"
                      :fill false
                      :backgroundColor "#36a2eb"
                      :borderColor "#36a2eb"}
                     {:data (mapv :count accepted)
                      :label "Hyväksytyt"
                      :fill false
                      :backgroundColor "#90ee90"
                      :borderColor "#90ee90"}
                     {:data (mapv :count rejected)
                      :label "Hylätyt"
                      :fill false
                      :backgroundColor "#ff6384"
                      :borderColor "#ff6384"}]}})

(defn- gen-granted-data [granted]
  {:type "pie"
   :options {:title {:display true :text "Myönnetyt avustukset"}
             :responsive true}
   :data {:labels (mapv :year granted)
          :datasets [{:data (mapv :budget-granted granted)
                      :label "Summat"
                      :fill false
                      :backgroundColor (vals colors)}]}})

(defn- chart [{:keys [id data]}]
  [(with-meta
     (create-canvas id)
     {:component-did-mount
      #(show-data! id data)})])

(defn home-page []
  [:div
   [chart
    {:id "applications"
     :data (gen-evaluations-data
             (:applications @data)
             (:evaluations-accepted @data)
             (:evaluations-rejected @data))}]
   [chart
    {:id "application-budget"
     :data (gen-budget-data (:applications @data) (:granted @data))}]
   [chart
    {:id "total-granted"
     :data (gen-granted-data (:granted @data))}]])

(defn init! []
  (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan raportteja" 3)]
      (put! dialog-chan 1)
      (let [result
            (<! (connection/get-reports))]
        (if (:success result)
          (reset! data (:body result))
          (dialogs/show-error-message!
            "Virhe raporttien latauksessa"
            (select-keys result [:status :error-text]))))
      (put! dialog-chan 2)
      (close! dialog-chan))))
