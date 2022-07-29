(ns oph.va.virkailija.talousarviotili-routes
  (:require [compojure.api.sweet :as compojure-api]
            [ring.util.http-response :refer [ok method-not-allowed unauthorized]]
            [oph.va.virkailija.schema :as schema]
            [oph.soresu.common.db :refer [query with-tx execute!]]
            [oph.va.virkailija.va-code-values-routes :refer [with-admin]]))

(defn- get-talousarviotilit-from-db []
  (query "SELECT id, year, name, code, amount
          FROM talousarviotilit" []))

(defn- create-new-talousarviotili [talousarviotili]
  (with-tx (fn [tx]
    (execute! tx "INSERT INTO talousarviotilit (year, code, name, amount)
                  VALUES (?, ?, ?, ?)
                  RETURNING *"
              [(:year talousarviotili)
               (:code talousarviotili)
               (:name talousarviotili)
               (:amount talousarviotili)]))))

(defn- delete-talousarviotili! [id]
  (with-tx (fn [tx]
    (execute! tx "DELETE FROM talousarviotilit WHERE id = ?" [id]))))

;; TODO: check is talousarviotili used in any avustushaku
(defn- talousarviotili-is-used? [id]
  (-> (query "SELECT false as used
              FROM talousarviotilit
              WHERE id = ?" [id])
      first
      :used))

(defn- get-talousarviotilit []
  (compojure-api/GET
    "/" [:as request]
    :return [schema/Talousarviotili]
    :summary "Get all talousarviotilit"
    (ok (get-talousarviotilit-from-db))))

(defn- create-talousarviotili []
  (compojure-api/POST
    "/" [:as request]
    :body [talousarviotili (compojure-api/describe schema/CreateTalousarviotili
                       "Create talousarviotili")]
    :return schema/Talousarviotili
    :summary "Create new talousarviotili"
    (with-admin request
      (ok (create-new-talousarviotili talousarviotili))
      (unauthorized ""))))

(defn- delete-talousarviotili []
  (compojure-api/DELETE
    "/:id/" [id :as request]
    :path-params [id :- Long]
    :summary "Delete talousarviotili. Only unused talousarviotili are allowed to be deleted"
    (with-admin request
      (if (talousarviotili-is-used? id)
        (method-not-allowed)
        (do (delete-talousarviotili! id)
            (ok "")))
      (unauthorized ""))))

(compojure-api/defroutes
  routes
  "talousarviotili routes"
  (get-talousarviotilit)
  (create-talousarviotili)
  (delete-talousarviotili))
