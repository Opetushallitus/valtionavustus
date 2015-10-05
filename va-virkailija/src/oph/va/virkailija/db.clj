(ns oph.va.virkailija.db
  (:use [oph.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.db.queries :as queries]))

(defn get-arviot [hakemus-ids]
  (if (empty? hakemus-ids)
    []
    (exec :db queries/get-arviot {:hakemus_ids hakemus-ids})))

(defn get-arvio [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec :db queries/get-arvio)
       first))

(defn update-or-create-hakemus-arvio [hakemus-id arvio]
  (let [status (keyword (:status arvio))
        budget-granted (:budget-granted arvio)
        updated (exec :db queries/update-arvio<! {:hakemus_id hakemus-id :status status :budget_granted budget-granted})]
    (if updated
      updated
      (exec :db queries/create-arvio<! {:hakemus_id hakemus-id :status status}))))

(defn health-check []
  (->> {}
       (exec :db queries/health-check)
       first
       :?column?
       (= 1)))

(defn- get-or-create-arvio [hakemus-id]
  (if-let [arvio (get-arvio hakemus-id)]
    arvio
    (update-or-create-hakemus-arvio hakemus-id {:status "unhandled"})))

(defn list-comments [hakemus-id]
  (let [arvio-id (:id (get-or-create-arvio hakemus-id))]
    (exec :db queries/list-comments {:arvio_id arvio-id})))

(defn add-comment [hakemus-id first-name last-name email comment]
  (let [arvio-id (:id (get-or-create-arvio hakemus-id))]
    (when-let [id (->> {:arvio_id arvio-id
                        :first_name first-name
                        :last_name last-name
                        :email email
                        :comment comment}
                       (exec :db queries/create-comment<!))]
      (list-comments hakemus-id))))
