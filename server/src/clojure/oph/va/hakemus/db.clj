(ns oph.va.hakemus.db
  (:require [oph.soresu.common.db :refer [query]]))

(defn close-hakemus-by-id-and-get-version [tx id]
  (first (query tx "UPDATE hakemukset SET version_closed = now() WHERE id = ? AND version_closed IS NULL RETURNING version" [id])))


(defn create-new-hakemus-version [tx id]
  (let [old-hakemus-version (:version (close-hakemus-by-id-and-get-version tx id))]
    (first (query tx "INSERT INTO hakemukset
              SELECT (copy).*
              FROM  (
                SELECT h #= hstore(array['version_closed', 'version', 'created_at'], array[null::text, (version::integer + 1)::text, now()::text]) AS copy
                FROM   hakemukset h
                WHERE  id = ? AND version = ?
                ) sub

                RETURNING *;" [id old-hakemus-version]))))

(defn get-hakemus-id-by-user-key-and-form-submission-id [tx user-key submission-id]
  (let [hakemus-id-rows (query tx "SELECT id FROM hakemukset WHERE user_key = ? AND form_submission_id = ? LIMIT 1" [user-key submission-id])]
    (:id (first hakemus-id-rows))))

(defn create-new-hakemus-version-from-user-key-form-submission-id [tx user-key submission-id]
  (create-new-hakemus-version tx (get-hakemus-id-by-user-key-and-form-submission-id tx user-key submission-id)))
