# Remove Yesql from hakija.db.queries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all yesql `defquery` indirection in `oph.va.hakija.db.queries` with inline SQL in the calling functions, eliminating the 3-file hop to read a query.

**Architecture:** Add `named-query`/`named-execute!` helpers to `oph.soresu.common.db` for queries with 6+ params. Replace each `(exec queries/foo params)` call in `hakija/db.clj` with direct `query-original-identifiers`/`execute!` calls (or `named-query`/`named-execute!` for large queries). Delete the defquery definitions, SQL files, and eventually the queries namespace.

**Tech Stack:** Clojure, clojure.java.jdbc, PostgreSQL

**Spec:** `docs/superpowers/specs/2026-03-18-remove-yesql-indirection-design.md`

---

## File Map

- **Modify:** `server/src/clojure/oph/soresu/common/db.clj` — add `named-query`, `named-execute!` helpers
- **Modify:** `server/src/clojure/oph/va/hakija/db.clj` — inline all SQL, remove `queries` require
- **Delete:** `server/src/clojure/oph/va/hakija/db/queries.clj` — entire file
- **Delete:** SQL files under `server/resources/sql/` that are ONLY used by this module (see Task 8 for shared file list)

## Important Context

### Identifier convention
- Use `query-original-identifiers` (preserves `:user_key` underscored keys, matching yesql behavior)
- Do NOT use `query` (which converts to `:user-key` dashed keys)

### Return value semantics
- Yesql `<!` queries return a **single map** via `jdbc/db-do-prepared-return-keys`
- `query-original-identifiers` returns a **sequence of maps**
- Always wrap `<!` replacements with `(first ...)` to preserve the single-map return

### Shared SQL files (DO NOT DELETE in this module)
These SQL files are referenced by BOTH `hakija.db.queries` AND `hakija.api.queries`:
- `sql/common/hakija/hakemus/update-status.sql`
- `sql/common/hakija/hakemus/lock.sql`
- `sql/common/hakija/hakemus/update-loppuselvitys-status.sql`
- `sql/common/hakija/hakemus/update-valiselvitys-status.sql`
- `sql/common/hakija/hakemus/close-existing.sql`

### Unused defqueries (dead code — delete without replacement)
- `lock-hakemus` — no call sites found
- `close-existing-hakemus!` — no call sites found
- `find-application-token` — no call sites found

---

### Task 1: Add named parameter helpers to common/db.clj

**Files:**
- Modify: `server/src/clojure/oph/soresu/common/db.clj`

- [ ] **Step 1: Add `replace-named-params`, `named-query`, and `named-execute!` to db.clj**

Add these functions after the existing `execute!` function (after line 110):

```clojure
(defn- replace-named-params [sql params]
  (let [param-names (atom [])
        replaced (clojure.string/replace sql #":(\w+)(?!:)"
                   (fn [[_ name]]
                     (swap! param-names conj (keyword name))
                     "?"))]
    [replaced (mapv params @param-names)]))

(defn named-query
  "Like query-original-identifiers but with :named_params and a map.
   Returns a sequence of maps with original (underscore) identifiers."
  ([sql params] (with-tx (fn [tx] (named-query tx sql params))))
  ([tx sql params]
   (let [[replaced-sql values] (replace-named-params sql params)]
     (jdbc/query tx (concat [replaced-sql] values)))))

(defn named-execute!
  "Like execute! but with :named_params and a map.
   For fire-and-forget writes only (return value is row count, not data).
   For writes that need return values, use named-query with RETURNING."
  ([sql params] (with-tx (fn [tx] (named-execute! tx sql params))))
  ([tx sql params]
   (let [[replaced-sql values] (replace-named-params sql params)]
     (jdbc/execute! tx (concat [replaced-sql] values)))))
```

Also add `clojure.string` to the `:require` if not already present.

- [ ] **Step 2: Verify `clojure.string` is available**

Check the ns declaration. If `clojure.string` is not required, add it:
```clojure
[clojure.string :as string]
```
Note: `string` is already aliased on line 7. Use `string/replace` instead of `clojure.string/replace` in the implementation.

- [ ] **Step 3: Commit**

```bash
git add server/src/clojure/oph/soresu/common/db.clj
git commit -m "Add named-query and named-execute! helpers to common db"
```

---

### Task 2: Replace avustushaku queries

**Files:**
- Modify: `server/src/clojure/oph/va/hakija/db.clj`

These are simple queries with 0-1 params.

- [ ] **Step 1: Replace `get-avustushaku` (line 31-33)**

```clojure
;; Before
(defn get-avustushaku [id]
  (->> (exec queries/get-avustushaku {:id id})
       first))

;; After
(defn get-avustushaku [id]
  (first
    (query-original-identifiers
      "select avustushaut.*, va_code_values.code as operational_unit_code
       from hakija.avustushaut
       left join virkailija.va_code_values on avustushaut.operational_unit_id = va_code_values.id
       where avustushaut.id = ? and status <> 'deleted'"
      [id])))
```

- [ ] **Step 2: Replace `get-avustushaku-roles` (line 38-39)**

```clojure
;; Before
(defn get-avustushaku-roles [avustushaku-id]
  (exec queries/get-avustushaku-roles {:avustushaku avustushaku-id}))

;; After
(defn get-avustushaku-roles [avustushaku-id]
  (query-original-identifiers
    "SELECT name, email, role FROM avustushaku_roles
     WHERE avustushaku = ? ORDER BY id DESC"
    [avustushaku-id]))
```

- [ ] **Step 3: Replace `list-avustushaut` (line 41-42)**

```clojure
;; Before
(defn list-avustushaut []
  (exec queries/list-avustushaut {}))

;; After
(defn list-avustushaut []
  (query-original-identifiers "select * from avustushaut" []))
```

- [ ] **Step 4: Replace `add-paatos-view` (line 44-45)**

```clojure
;; Before
(defn add-paatos-view [hakemus-id headers remote-addr]
  (exec queries/create-paatos-view! {:hakemus_id hakemus-id :headers headers :remote_addr remote-addr}))

;; After
(defn add-paatos-view [hakemus-id headers remote-addr]
  (execute!
    "insert into hakemus_paatokset_views (hakemus_id,headers,remote_addr) values (?,?,?)"
    [hakemus-id headers remote-addr]))
```

Note: `execute!` (2-arity, no `tx`) is already defined in `oph.soresu.common.db` and auto-wraps in transaction. It is already imported via `(:require ... [oph.soresu.common.db :refer [exec with-tx query query-original-identifiers execute!]])` on line 9.

- [ ] **Step 5: Commit**

```bash
git add server/src/clojure/oph/va/hakija/db.clj
git commit -m "Inline avustushaku SQL queries in hakija/db.clj"
```

---

### Task 3: Replace simple hakemus queries

**Files:**
- Modify: `server/src/clojure/oph/va/hakija/db.clj`

- [ ] **Step 1: Replace `get-hakemus` (lines 65-71)**

This function has two arities. Both use `queries/get-hakemus-by-user-key`.

```clojure
;; Before
(defn get-hakemus
  ([user-key]
   (->> {:user_key user-key}
        (exec queries/get-hakemus-by-user-key)
        first))
  ([tx user-key]
   (first (queries/get-hakemus-by-user-key {:user_key user-key} {:connection tx}))))

;; After
(defn get-hakemus
  ([user-key]
   (first
     (query-original-identifiers
       "select * from hakemukset where user_key = ? AND version_closed IS NULL and status <> 'cancelled'"
       [user-key])))
  ([tx user-key]
   (first
     (query-original-identifiers tx
       "select * from hakemukset where user_key = ? AND version_closed IS NULL and status <> 'cancelled'"
       [user-key]))))
```

- [ ] **Step 2: Replace `get-hakemus-version` (lines 82-85)**

```clojure
;; Before
(defn get-hakemus-version [user-key version]
  (first
   (exec queries/get-hakemus-version-by-user-id
         {:user_key user-key :version version})))

;; After
(defn get-hakemus-version [user-key version]
  (first
    (query-original-identifiers
      "SELECT * FROM hakemukset
       WHERE user_key = ? AND version = ? AND status <> 'cancelled' LIMIT 1"
      [user-key version])))
```

- [ ] **Step 3: Replace `get-hakemus-paatos` (lines 87-90)**

```clojure
;; Before
(defn get-hakemus-paatos [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec queries/get-hakemus-paatokset)
       first))

;; After
(defn get-hakemus-paatos [hakemus-id]
  (first
    (query-original-identifiers
      "select * from hakemus_paatokset where hakemus_id = ?"
      [hakemus-id])))
```

- [ ] **Step 4: Replace `list-hakemus-change-requests` (lines 92-94)**

```clojure
;; Before
(defn list-hakemus-change-requests [user-key]
  (->> {:user_key user-key}
       (exec queries/list-hakemus-change-requests-by-user-id)))

;; After
(defn list-hakemus-change-requests [user-key]
  (query-original-identifiers
    "select * from hakemukset
     where user_key = ? and status in ('pending_change_request', 'officer_edit') and last_status_change_at = created_at
     order by version"
    [user-key]))
```

- [ ] **Step 5: Replace `find-hakemus-by-parent-id-and-type` (lines 96-98)**

```clojure
;; Before
(defn find-hakemus-by-parent-id-and-type [parent-id hakemus-type]
  (->> {:parent_id parent-id :hakemus_type hakemus-type}
       (exec queries/find-by-parent-id-and-hakemus-type) first))

;; After
(defn find-hakemus-by-parent-id-and-type [parent-id hakemus-type]
  (first
    (query-original-identifiers
      "select * from hakemukset where parent_id = ? and hakemus_type = ? AND version_closed IS NULL"
      [parent-id hakemus-type])))
```

- [ ] **Step 6: Commit**

```bash
git add server/src/clojure/oph/va/hakija/db.clj
git commit -m "Inline simple hakemus SQL queries in hakija/db.clj"
```

---

### Task 4: Replace register number sequence queries

**Files:**
- Modify: `server/src/clojure/oph/va/hakija/db.clj`

These are `<!` queries whose return values are used (destructured for `seq_number`). Need `RETURNING` clauses and `first`.

- [ ] **Step 1: Replace `register-number-sequence-exists?` and the generate function (lines 100-113)**

```clojure
;; Before
(defn- register-number-sequence-exists? [register-number]
  (->> (exec queries/register-number-sequence-exists? {:suffix register-number})
       first
       nil?
       not))

(defn- generate-register-number [avustushaku-id]
  (if-let [avustushaku-register-number (-> (get-avustushaku avustushaku-id) :register_number)]
    (when (re-matches #"\d+/\d+" avustushaku-register-number)
      (let [params {:suffix avustushaku-register-number}
            {:keys [seq_number]} (if (register-number-sequence-exists? avustushaku-register-number)
                                   (exec queries/update-register-number-sequence<! params)
                                   (exec queries/create-register-number-sequence<! params))]
        (format "%d/%s" seq_number avustushaku-register-number)))))

;; After
(defn- register-number-sequence-exists? [register-number]
  (some? (first (query-original-identifiers
                  "select 1 from register_number_sequences where suffix = ?"
                  [register-number]))))

(defn- generate-register-number [avustushaku-id]
  (if-let [avustushaku-register-number (-> (get-avustushaku avustushaku-id) :register_number)]
    (when (re-matches #"\d+/\d+" avustushaku-register-number)
      (let [{:keys [seq_number]}
            (if (register-number-sequence-exists? avustushaku-register-number)
              (first (query-original-identifiers
                       "update register_number_sequences set seq_number = seq_number+1
                        where suffix = ? RETURNING *"
                       [avustushaku-register-number]))
              (first (query-original-identifiers
                       "insert into register_number_sequences (suffix) values (?) RETURNING *"
                       [avustushaku-register-number])))]
        (format "%d/%s" seq_number avustushaku-register-number)))))
```

Note: The original `register-number-sequence-exists?` used a `(not (nil? (first ...)))` chain. Simplified to `some?` which is equivalent and clearer.

- [ ] **Step 2: Commit**

```bash
git add server/src/clojure/oph/va/hakija/db.clj
git commit -m "Inline register number sequence SQL queries in hakija/db.clj"
```

---

### Task 5: Replace attachment queries

**Files:**
- Modify: `server/src/clojure/oph/va/hakija/db.clj`

This includes the `exec-all` replacement for `create-attachment`.

- [ ] **Step 1: Replace `attachment-exists?` (lines 714-718)**

```clojure
;; Before
(defn attachment-exists? [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec queries/attachment-exists?)
       first))

;; After
(defn attachment-exists? [hakemus-id field-id]
  (first
    (query-original-identifiers
      "select 1 from attachments where hakemus_id = ? and field_id = ?"
      [hakemus-id field-id])))
```

- [ ] **Step 2: Replace `close-existing-attachment!` (lines 753-756)**

```clojure
;; Before
(defn close-existing-attachment! [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec queries/close-existing-attachment!)))

;; After
(defn close-existing-attachment! [hakemus-id field-id]
  (execute!
    "update attachments set version_closed = now()
     where hakemus_id = ? and field_id = ? and version_closed is null"
    [hakemus-id field-id]))
```

- [ ] **Step 3: Replace `list-attachments` (lines 758-760)**

```clojure
;; Before
(defn list-attachments [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec queries/list-attachments)))

;; After
(defn list-attachments [hakemus-id]
  (query-original-identifiers
    "select id, version, hakemus_id, hakemus_version, created_at, field_id, filename, file_size, content_type
     from attachments
     where hakemus_id = ? and version_closed is null"
    [hakemus-id]))
```

- [ ] **Step 4: Replace `download-attachment` (lines 768-776)**

```clojure
;; Before
(defn download-attachment [hakemus-id field-id]
  (let [result (->> {:hakemus_id hakemus-id
                     :field_id field-id}
                    (exec queries/download-attachment)
                    first)]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))

;; After
(defn download-attachment [hakemus-id field-id]
  (let [result (first
                 (query-original-identifiers
                   "select file_size, content_type, filename, file_data from attachments
                    where hakemus_id = ? and field_id = ? and version_closed is null"
                   [hakemus-id field-id]))]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))
```

- [ ] **Step 5: Replace `create-attachment` (lines 739-751) — includes exec-all replacement**

This function uses `exec-all` for the update path (close + insert atomically) and `exec` for the create path. Replace with explicit `with-tx`.

```clojure
;; Before
(defn create-attachment [hakemus-id hakemus-version field-id filename content-type size file]
  (let [blob (slurp-binary-file! file)
        params (-> {:hakemus_id hakemus-id
                    :hakemus_version hakemus-version
                    :field_id field-id
                    :filename filename
                    :content_type content-type
                    :file_size size
                    :file_data blob})]
    (if (attachment-exists? hakemus-id field-id)
      (exec-all [queries/close-existing-attachment! params
                 queries/update-attachment<! params])
      (exec queries/create-attachment<! params))))

;; After
(defn create-attachment [hakemus-id hakemus-version field-id filename content-type size file]
  (let [blob (slurp-binary-file! file)]
    (if (attachment-exists? hakemus-id field-id)
      (with-tx (fn [tx]
        (execute! tx
          "update attachments set version_closed = now()
           where hakemus_id = ? and field_id = ? and version_closed is null"
          [hakemus-id field-id])
        (first
          (named-query tx
            "insert into attachments (id, version, hakemus_id, hakemus_version, field_id, filename, content_type, file_size, file_data)
             select id, max(version) + 1, :hakemus_id, :hakemus_version, :field_id, :filename, :content_type, :file_size, :file_data
             from attachments where hakemus_id = :hakemus_id and field_id = :field_id group by id
             RETURNING *"
            {:hakemus_id hakemus-id :hakemus_version hakemus-version :field_id field-id
             :filename filename :content_type content-type :file_size size :file_data blob}))))
      (first
        (named-query
          "insert into attachments (version, hakemus_id, hakemus_version, field_id, filename, content_type, file_size, file_data)
           values (0, :hakemus_id, :hakemus_version, :field_id, :filename, :content_type, :file_size, :file_data)
           RETURNING *"
          {:hakemus_id hakemus-id :hakemus_version hakemus-version :field_id field-id
           :filename filename :content_type content-type :file_size size :file_data blob})))))
```

Note: Both insert paths use `named-query` (7 params >= 6 threshold) with `RETURNING *` and `first` to match the yesql `<!` single-map return.

- [ ] **Step 6: Commit**

```bash
git add server/src/clojure/oph/va/hakija/db.clj
git commit -m "Inline attachment SQL queries in hakija/db.clj"
```

---

### Task 6: Replace token and selvitys status queries

**Files:**
- Modify: `server/src/clojure/oph/va/hakija/db.clj`

- [ ] **Step 1: Replace `valid-token?` (lines 778-784)**

```clojure
;; Before
(defn valid-token? [token application-id]
  (and
   (some? token)
   (not
    (empty?
     (exec queries/get-application-token
           {:token token :application_id application-id})))))

;; After
(defn valid-token? [token application-id]
  (and
   (some? token)
   (not
    (empty?
     (query-original-identifiers
       "SELECT id, application_id, token FROM hakija.application_tokens
        WHERE application_id = ? AND token = ? AND revoked IS NOT TRUE"
       [application-id token])))))
```

Note: Parameter order matters! The SQL has `application_id` before `token` in WHERE clause. Match positional `?` order to the SQL column order.

- [ ] **Step 2: Replace `revoke-token` (lines 792-794)**

```clojure
;; Before
(defn revoke-token [token]
  (exec queries/revoke-application-token!
        {:token token}))

;; After
(defn revoke-token [token]
  (execute!
    "UPDATE hakija.application_tokens SET revoked = TRUE WHERE token = ?"
    [token]))
```

- [ ] **Step 3: Replace `update-loppuselvitys-status` (lines 708-709)**

```clojure
;; Before
(defn update-loppuselvitys-status [hakemus-id status]
  (exec queries/update-loppuselvitys-status<! {:id hakemus-id :status status}))

;; After
(defn update-loppuselvitys-status [hakemus-id status]
  (execute!
    "update hakemukset set status_loppuselvitys = ? where id = ? and version_closed is null"
    [status hakemus-id]))
```

Note: `<!` suffix but the return value is not used by callers — `execute!` (returns row count) is fine.

- [ ] **Step 4: Replace `update-valiselvitys-status` (lines 711-712)**

```clojure
;; Before
(defn update-valiselvitys-status [hakemus-id status]
  (exec queries/update-valiselvitys-status<! {:id hakemus-id :status status}))

;; After
(defn update-valiselvitys-status [hakemus-id status]
  (execute!
    "update hakemukset set status_valiselvitys = ? where id = ? and version_closed is null"
    [status hakemus-id]))
```

- [ ] **Step 5: Commit**

```bash
git add server/src/clojure/oph/va/hakija/db.clj
git commit -m "Inline token and selvitys status SQL queries in hakija/db.clj"
```

---

### Task 7: Replace large hakemus mutation queries (named params)

**Files:**
- Modify: `server/src/clojure/oph/va/hakija/db.clj`

These queries have 6+ params and use `named-query`/`named-execute!`. Add `[oph.soresu.common.db :refer [...named-query named-execute!]]` to the require.

- [ ] **Step 1: Update the ns require to include named-query and named-execute!**

In the `(:require ...)` block on line 9, update the `oph.soresu.common.db` refer:

```clojure
;; Before
[oph.soresu.common.db :refer [exec with-tx query query-original-identifiers execute!]]

;; After
[oph.soresu.common.db :refer [exec with-tx query query-original-identifiers execute! named-query named-execute!]]
```

- [ ] **Step 2: Replace `create-hakemus!` (lines 119-131)**

```clojure
;; Before
(defn create-hakemus! [avustushaku-id form-id answers hakemus-type register-number budget-totals parent-id]
  (let [submission (form-db/create-submission! form-id answers)
        user-key (generate-hash-id)
        params (-> {:avustushaku_id  avustushaku-id
                    :user_key        user-key
                    :form_submission (:id submission)
                    :register_number (if (nil? register-number) (generate-register-number avustushaku-id) register-number)
                    :hakemus_type    hakemus-type
                    :parent_id       parent-id}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))
        hakemus (exec queries/create-hakemus<! params)]
    {:hakemus hakemus :submission submission}))

;; After
(defn create-hakemus! [avustushaku-id form-id answers hakemus-type register-number budget-totals parent-id]
  (let [submission (form-db/create-submission! form-id answers)
        user-key (generate-hash-id)
        params (-> {:avustushaku_id  avustushaku-id
                    :user_key        user-key
                    :form_submission (:id submission)
                    :register_number (if (nil? register-number) (generate-register-number avustushaku-id) register-number)
                    :hakemus_type    hakemus-type
                    :parent_id       parent-id}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))
        hakemus (first
                  (named-query
                    "INSERT INTO hakemukset (id, avustushaku, version, user_key, form_submission_id,
                       form_submission_version, budget_total, budget_oph_share, organization_name,
                       project_name, language, register_number, last_status_change_at, hakemus_type, parent_id)
                     SELECT nextval('hakemukset_id_seq'), :avustushaku_id, 0, :user_key, submissions.id,
                       submissions.version, :budget_total, :budget_oph_share, :organization_name,
                       :project_name, :language, :register_number, now(), :hakemus_type, :parent_id
                     FROM form_submissions submissions
                     WHERE id = :form_submission AND version_closed IS NULL
                     RETURNING *"
                    params))]
    {:hakemus hakemus :submission submission}))
```

- [ ] **Step 3: Replace `update-hakemus-tx` (lines 617-633)**

```clojure
;; Before
(defn update-hakemus-tx [tx avustushaku-id user-key submission-version answers budget-totals hakemus]
  (let [register-number (or (:register_number hakemus)
                            (generate-register-number avustushaku-id))
        new-hakemus (hakemus-copy/create-new-hakemus-version tx (:id hakemus))
        params (-> {:avustushaku_id avustushaku-id
                    :user_key user-key
                    :version (:version new-hakemus)
                    ...}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))]
    (queries/update-hakemus-submission<! params {:connection tx})))

;; After
(defn update-hakemus-tx [tx avustushaku-id user-key submission-version answers budget-totals hakemus]
  (let [register-number (or (:register_number hakemus)
                            (generate-register-number avustushaku-id))
        new-hakemus (hakemus-copy/create-new-hakemus-version tx (:id hakemus))
        params (-> {:avustushaku_id avustushaku-id
                    :user_key user-key
                    :version (:version new-hakemus)
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :register_number register-number
                    :form_submission_id (:form_submission_id hakemus)
                    :form_submission_version submission-version}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))]
    (first
      (named-query tx
        "UPDATE hakemukset SET
           avustushaku = :avustushaku_id, user_key = :user_key,
           form_submission_id = :form_submission_id, form_submission_version = :form_submission_version,
           user_oid = :user_oid, user_first_name = :user_first_name,
           user_last_name = :user_last_name, user_email = :user_email,
           budget_total = :budget_total, budget_oph_share = :budget_oph_share,
           organization_name = :organization_name, project_name = :project_name,
           language = :language, register_number = :register_number,
           business_id = :business_id, owner_type = :owner_type
         WHERE user_key = :user_key AND form_submission_id = :form_submission_id
           AND version_closed IS NULL AND version = :version
         RETURNING *"
        params))))
```

Note: Uses `named-query` + `first` + `RETURNING *` because callers (handlers.clj) access the returned hakemus map fields (`:user_key`, `:status`, `:version`, etc.).

- [ ] **Step 4: Replace `update-status` (lines 635-652)**

```clojure
;; After
(defn- update-status
  [tx avustushaku-id user-key submission-id submission-version register-number answers budget-totals status status-change-comment]
  (let [new-hakemus (hakemus-copy/create-new-hakemus-version-from-user-key-form-submission-id tx user-key submission-id)
        params (-> {:avustushaku_id avustushaku-id
                    :version (:version new-hakemus)
                    :user_key user-key
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :form_submission_id submission-id
                    :form_submission_version submission-version
                    :register_number register-number
                    :status status
                    :status_change_comment status-change-comment}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))]
    (first
      (named-query tx
        "UPDATE hakemukset SET
           avustushaku = :avustushaku_id, user_key = :user_key,
           form_submission_id = :form_submission_id, form_submission_version = :form_submission_version,
           budget_total = :budget_total, budget_oph_share = :budget_oph_share,
           organization_name = :organization_name, project_name = :project_name,
           language = :language, register_number = :register_number,
           user_oid = :user_oid, user_first_name = :user_first_name,
           user_last_name = :user_last_name, user_email = :user_email,
           status = :status, status_change_comment = :status_change_comment,
           last_status_change_at = now()
         WHERE user_key = :user_key AND form_submission_id = :form_submission_id
           AND version_closed IS NULL AND version = :version
         RETURNING *"
        params))))
```

Note: Uses `named-query` + `first` + `RETURNING *` because `verify-hakemus` callers (handlers.clj) access the returned hakemus map.

- [ ] **Step 5: Replace `new-update-status` (lines 654-672)**

```clojure
;; After
(defn- new-update-status
  [tx avustushaku-id hakemus submission-version answers budget-totals status status-change-comment user-key]
  (let [new-hakemus (hakemus-copy/create-new-hakemus-version tx (:id hakemus))
        params (-> {:avustushaku_id avustushaku-id
                    :version (:version new-hakemus)
                    :user_key user-key
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :form_submission_id (:form_submission_id hakemus)
                    :form_submission_version submission-version
                    :register_number (:register_number hakemus)
                    :status status
                    :status_change_comment status-change-comment}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))]
    (named-execute! tx
      "UPDATE hakemukset SET
         avustushaku = :avustushaku_id, user_key = :user_key,
         form_submission_id = :form_submission_id, form_submission_version = :form_submission_version,
         budget_total = :budget_total, budget_oph_share = :budget_oph_share,
         organization_name = :organization_name, project_name = :project_name,
         language = :language, register_number = :register_number,
         user_oid = :user_oid, user_first_name = :user_first_name,
         user_last_name = :user_last_name, user_email = :user_email,
         status = :status, status_change_comment = :status_change_comment,
         last_status_change_at = now()
       WHERE user_key = :user_key AND form_submission_id = :form_submission_id
         AND version_closed IS NULL AND version = :version"
      params)
    new-hakemus))
```

Note: This function returns `new-hakemus`, not the query result. The query is fire-and-forget.

- [ ] **Step 6: Replace `set-submitted-version` (lines 677-678)**

```clojure
;; Before
(defn set-submitted-version [tx params]
  (queries/set-application-submitted-version<! params {:connection tx}))

;; After
(defn set-submitted-version [tx params]
  (first
    (query-original-identifiers tx
      "UPDATE hakemukset SET submitted_version = version
       WHERE user_key = ? AND form_submission_id = ? AND version = ? AND version_closed IS NULL
       RETURNING *"
      [(:user_key params) (:form_submission_id params) (:version params)])))
```

Note: Only 3 params — below threshold, use positional `?`. Uses `first` + `RETURNING *` because `submit-hakemus` returns this value and callers (handlers.clj) access `:language`, `:user_key` and other map fields from it.

- [ ] **Step 7: Commit**

```bash
git add server/src/clojure/oph/va/hakija/db.clj
git commit -m "Inline large hakemus mutation queries with named params in hakija/db.clj"
```

---

### Task 8: Clean up — delete queries namespace and SQL files

**Files:**
- Delete: `server/src/clojure/oph/va/hakija/db/queries.clj`
- Delete: SQL files (see list below)
- Modify: `server/src/clojure/oph/va/hakija/db.clj` — remove `queries` require

- [ ] **Step 1: Remove the `queries` require from db.clj**

In the ns declaration, remove:
```clojure
[oph.va.hakija.db.queries :as queries]
```

Also remove the `exec` and `exec-all` imports if no longer used in this file. Check if `exec` is still used — it may be used elsewhere in the file for `hakija-queries` calls. If `exec` is still referenced (via `hakija-queries` which is `api.queries`), keep it.

Actually, check: `hakija-queries` on line 36 is called as `(hakija-queries/get-avustushaku {:id id} {:connection tx})` — this does NOT use `exec`, it calls the yesql function directly. So `exec` may no longer be needed in this file after migration. Grep the file for remaining `exec` usage before removing.

Also remove `exec-all` from the refer list if it was there (it's used as a macro from `oph.soresu.common.db`).

- [ ] **Step 2: Delete the queries namespace file**

```bash
rm server/src/clojure/oph/va/hakija/db/queries.clj
```

- [ ] **Step 3: Delete SQL files that are NOT shared with other modules**

Safe to delete (only referenced by `hakija.db.queries`):
```bash
rm server/resources/sql/hakemus/create.sql
rm server/resources/sql/hakemus/find-by-parent-id-and-hakemus-type.sql
rm server/resources/sql/hakemus/get_by_user_id.sql
rm server/resources/sql/hakemus/get-version-by-user-id.sql
rm server/resources/sql/hakemus-paatokset/get.sql
rm server/resources/sql/hakemus/list-change-requests-by-user-id.sql
rm server/resources/sql/hakemus/update-submission.sql
rm server/resources/sql/hakemus/set-submitted-version.sql
rm server/resources/sql/hakemus/get-application-token.sql
rm server/resources/sql/hakemus/find-application-token.sql
rm server/resources/sql/hakemus/revoke-token.sql
rm server/resources/sql/avustushaku/get.sql
rm server/resources/sql/avustushaku/list.sql
rm server/resources/sql/hakemus-paatokset-views/create.sql
rm server/resources/sql/avustushaku/get-roles.sql
rm server/resources/sql/attachment/exists.sql
rm server/resources/sql/attachment/list.sql
rm server/resources/sql/attachment/download.sql
rm server/resources/sql/attachment/create.sql
rm server/resources/sql/attachment/update.sql
rm server/resources/sql/attachment/close-existing.sql
rm server/resources/sql/register-number-sequence/exists.sql
rm server/resources/sql/register-number-sequence/create.sql
rm server/resources/sql/register-number-sequence/update.sql
```

**DO NOT delete** (shared with `hakija.api.queries`):
- `sql/common/hakija/hakemus/update-status.sql`
- `sql/common/hakija/hakemus/lock.sql`
- `sql/common/hakija/hakemus/update-loppuselvitys-status.sql`
- `sql/common/hakija/hakemus/update-valiselvitys-status.sql`
- `sql/common/hakija/hakemus/close-existing.sql`

- [ ] **Step 4: Delete empty parent directories if applicable**

```bash
rmdir server/resources/sql/register-number-sequence/ 2>/dev/null
rmdir server/resources/sql/hakemus-paatokset/ 2>/dev/null
rmdir server/resources/sql/hakemus-paatokset-views/ 2>/dev/null
```

Only delete if empty. The `sql/hakemus/`, `sql/avustushaku/`, and `sql/attachment/` directories may have files from other modules — check before deleting.

- [ ] **Step 5: Verify no remaining references to deleted files**

```bash
grep -r "hakija.db.queries" server/src/
grep -r "sql/hakemus/create.sql" server/resources/ server/src/
grep -r "sql/avustushaku/get.sql" server/resources/ server/src/
```

All should return empty (or only hits in `hakija.api.queries` for the different-path duplicates).

- [ ] **Step 6: Commit**

```bash
git add -A server/src/clojure/oph/va/hakija/db/ server/resources/sql/ server/src/clojure/oph/va/hakija/db.clj
git commit -m "Remove hakija.db.queries namespace and SQL files"
```

---

### Task 9: Run tests

- [ ] **Step 1: Run backend tests**

```bash
./lein with-profile test spec -f d
```

Expected: All tests pass. If failures occur, they will likely be due to:
- Parameter ordering bugs in positional `?` queries
- Missing `first` on `<!` replacement
- Identifier key mismatch (should not happen since we use `query-original-identifiers`)

- [ ] **Step 2: Fix any test failures**

If tests fail, check:
1. Parameter order matches `?` placeholder order in SQL
2. `RETURNING *` is present on insert/update queries whose return values are used
3. `first` wraps all query calls that previously used `<!` yesql functions
4. SQL syntax is correct (no stray `:param` names left in inline SQL)

- [ ] **Step 3: Final commit if fixes were needed**

```bash
git add server/src/clojure/oph/va/hakija/db.clj server/src/clojure/oph/soresu/common/db.clj
git commit -m "Fix test failures from yesql removal"
```
