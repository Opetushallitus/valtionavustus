(ns oph.va.virkailija.talousarviotili-routes
  (:require [compojure.api.sweet :as compojure-api]
            [clojure.tools.logging :as log]
            [ring.util.http-response :refer [ok method-not-allowed unauthorized unprocessable-entity! bad-request! internal-server-error!]]
            [oph.va.virkailija.schema :as schema]
            [oph.soresu.common.db :refer [query with-tx execute!]]
            [oph.va.virkailija.va-code-values-routes :refer [with-admin]]))

(defn- get-talousarviotilit-from-db []
  (query "
  SELECT t.*,
       coalesce(
           jsonb_agg(
               jsonb_build_object(
                   'id',
                   a.id,
                   'name',
                   a.content->'name'->'fi'
              )
            ) filter ( where a.id is not null ),
           '[]'::jsonb
      ) as avustushaut
  FROM virkailija.talousarviotilit t
  LEFT JOIN virkailija.avustushaku_talousarviotilit at
    ON  at.talousarviotili_id = t.id
    AND at.deleted IS NULL
  LEFT JOIN hakija.avustushaut a ON a.id = at.avustushaku_id
  WHERE t.deleted IS NULL
  GROUP BY t.id
  ORDER BY t.id DESC;
  " []))

(defn- update-existing-talousarviotili [talousarviotili]
  (with-tx (fn [tx]
    (-> (query tx "UPDATE talousarviotilit
                   SET year = ?, code = ?, name = ?, amount = ?
                   WHERE id = ?
                   RETURNING *"
               [(:year talousarviotili)
                (:code talousarviotili)
                (:name talousarviotili)
                (:amount talousarviotili)
                (:id talousarviotili)])
        first))))

(defn- create-new-talousarviotili [talousarviotili]
  (with-tx (fn [tx]
    (-> (query tx "INSERT INTO talousarviotilit (year, code, name, amount)
                  VALUES (?, ?, ?, ?)
                  RETURNING *"
               [(:year talousarviotili)
                (:code talousarviotili)
                (:name talousarviotili)
                (:amount talousarviotili)])
        first))))

(defn- delete-talousarviotili! [id]
  (with-tx (fn [tx]
    (execute! tx "UPDATE talousarviotilit set deleted = now() WHERE id = ?" [id]))))

(defn- talousarviotili-is-used? [id]
  (-> (query "SELECT EXISTS (
                SELECT 1
                FROM virkailija.avustushaku_talousarviotilit at
                WHERE at.talousarviotili_id = ?
                AND at.deleted IS NULL
              ) as used" [id])
      first
      :used))

(defn- get-talousarviotilit []
  (compojure-api/GET
    "/" [:as request]
    :return [schema/VaCodesTalousarviotili]
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
      (try
        (ok (create-new-talousarviotili talousarviotili))
        (catch java.sql.SQLException e
          ((case (.getSQLState e)
             "23505" (unprocessable-entity!)
             "23514" (bad-request!)
             (internal-server-error!)))))
      (unauthorized ""))))

(defn- update-talousarviotili []
  (compojure-api/POST
    "/:id/" [id :as request]
    :body [talousarviotili (compojure-api/describe schema/UpdateTalousarviotili "Update talousarviotili")]
    :return schema/Talousarviotili
    (with-admin request
      (try
        (ok (update-existing-talousarviotili talousarviotili))
        (catch java.sql.SQLException e
          (case (.getSQLState e)
             "23505" (unprocessable-entity!)
             "23514" (bad-request!)
             (do
               (log/error e "Unexpected error when updating talousarviotili")
               (internal-server-error!)))))
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
  (update-talousarviotili)
  (delete-talousarviotili))
