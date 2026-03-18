# Remove Yesql Indirection

## Problem

Database queries go through three levels of indirection:
1. `db.clj` calls `(exec queries/get-foo {:param val})`
2. `queries.clj` has `(defquery get-foo "sql/path/to/file.sql")`
3. `sql/path/to/file.sql` contains the actual SQL

This makes it impossible to read the SQL without jumping through two files.

## Design

### Strategy

Replace all yesql `defquery` + `.sql` file pairs with inline SQL in the calling `db.clj` functions. Work module by module, starting with `oph.va.hakija.db.queries`.

### Identifier Convention

Use `query-original-identifiers` (not `query`) to preserve underscore-keyed results (`:user_key`, not `:user-key`). This matches yesql's default behavior and avoids changing any downstream accessor code.

### Named Parameter Helper

For queries with 6+ parameters, use `named-query` / `named-execute!` helpers that accept `:param_name` placeholders in the SQL string and a parameter map. This prevents positional ordering bugs in large UPDATE/INSERT statements.

The helpers go in `oph.soresu.common.db`:

```clojure
(defn- replace-named-params [sql params]
  (let [param-names (atom [])
        replaced (clojure.string/replace sql #":(\w+)(?!:)"
                   (fn [[_ name]]
                     (swap! param-names conj (keyword name))
                     "?"))]
    [replaced (mapv params @param-names)]))

(defn named-query
  "Like query-original-identifiers but with :named params and a map.
   Returns a sequence of maps with original (underscore) identifiers."
  ([sql params] (with-tx (fn [tx] (named-query tx sql params))))
  ([tx sql params]
   (let [[replaced-sql values] (replace-named-params sql params)]
     (jdbc/query tx (concat [replaced-sql] values)))))

(defn named-execute!
  "Like execute! but with :named params and a map.
   For fire-and-forget writes only (return value is row count, not data).
   For writes that need return values, use named-query with RETURNING."
  ([sql params] (with-tx (fn [tx] (named-execute! tx sql params))))
  ([tx sql params]
   (let [[replaced-sql values] (replace-named-params sql params)]
     (jdbc/execute! tx (concat [replaced-sql] values)))))
```

**Note on the regex**: `#":(\w+)(?!:)"` uses a negative lookahead `(?!:)` to avoid matching PostgreSQL's `::` type cast syntax (e.g., `created_at::timestamptz`). Without this, `:created_at::timestamptz` would incorrectly replace `:created_at` with `?`. **CAUTION**: the lookahead only protects the *first* colon of `::`. In `column_name::text`, the *second* `:` still matches `:text` as a named parameter. For `named-query`/`named-execute!` SQL, use `CAST(column AS text)` instead of `column::text`.

**Note on IN-list parameters**: Yesql supports passing a list/vector for `IN (:param)` clauses, auto-expanding to the right number of `?` placeholders. Later modules (e.g., `hakija.api.queries`) use this. When migrating those, either: (a) use PostgreSQL's `= ANY(?)` with JDBC arrays instead, or (b) add list expansion logic to `replace-named-params`. Decide per module.

### Threshold Rule

- **< 6 params**: Use `query-original-identifiers` / `execute!` with positional `?`
- **>= 6 params**: Use `named-query` / `named-execute!` with `:named_params` and a map

### RETURNING Clauses

Yesql's `<!` suffix uses `jdbc/db-do-prepared-return-keys` which auto-returns a **single map** of the inserted/updated row. When migrating `<!` queries:
- Add `RETURNING *` (or specific columns) to the SQL
- Use `named-query` or `query-original-identifiers` (since RETURNING makes it behave like a SELECT)
- **Critical**: These return a **sequence**, not a single map. Always wrap with `first` at the call site to match yesql's single-map return behavior.

### exec-all Replacement

`exec-all` (used in `create-attachment`) is replaced with explicit `with-tx` + sequential calls inside the transaction:

```clojure
;; Before
(exec-all [queries/close-existing-attachment! params
           queries/update-attachment<! params])

;; After
(with-tx (fn [tx]
  (execute! tx "UPDATE attachments SET version_closed = now() WHERE ..." [...])
  (first (query-original-identifiers tx "INSERT INTO attachments (...) VALUES (...) RETURNING *" [...]))))
```

### Calling Convention Examples

**Simple query (< 6 params):**
```clojure
;; Before
(exec queries/get-avustushaku-roles {:avustushaku avustushaku-id})

;; After
(query-original-identifiers
  "SELECT name, email, role FROM avustushaku_roles
   WHERE avustushaku = ? ORDER BY id DESC"
  [avustushaku-id])
```

**Large update (>= 6 params, no return value needed):**
```clojure
;; Before
(queries/update-hakemus-submission<! params {:connection tx})

;; After
(named-execute! tx
  "UPDATE hakemukset SET avustushaku = :avustushaku_id, user_key = :user_key, ..."
  params)
```

**Insert with return value (always wrap with `first`):**
```clojure
;; Before
(exec queries/create-hakemus<! params)  ;; returns single map

;; After (RETURNING added, first to match single-map behavior)
(first
  (named-query
    "INSERT INTO hakemukset (...) SELECT ... RETURNING *"
    params))
```

**`<!` update with return value:**
```clojure
;; Before
{:keys [seq_number]} (exec queries/update-register-number-sequence<! params)

;; After
{:keys [seq_number]} (first
  (query-original-identifiers
    "UPDATE register_number_sequences SET seq_number = seq_number+1
     WHERE suffix = ? RETURNING seq_number"
    [suffix]))
```

### What Gets Deleted Per Module

1. All `defquery` lines from the module's `queries.clj`
2. All referenced `.sql` files — **only after verifying no other namespace references them**
3. The `queries.clj` namespace itself (once empty)
4. The `(:require [yesql.core ...])` import

**Shared SQL files warning**: Files under `sql/common/hakija/hakemus/` are shared between `hakija.db.queries` AND `hakija.api.queries`. When migrating module 1, do NOT delete these shared SQL files — they must remain until module 2 is also migrated.

### What Gets Deleted Last (after all modules done)

1. The `[yesql "0.5.4"]` dependency from `project.clj`
2. The `exec` and `exec-all` macros from `oph.soresu.common.db` (if no longer used)

## Scope

### Module Order

1. `oph.va.hakija.db.queries` — first, as proof of concept
2. `oph.va.hakija.api.queries`
3. `oph.va.virkailija.db.queries`
4. `oph.va.virkailija.db.external_queries`
5. `oph.soresu.form.db.queries`
6. `oph.soresu.common.db.queries`

### Per-Module Checklist

1. Read the `queries.clj` to get the list of defqueries and their SQL file paths
2. Read each SQL file to get the actual query
3. Find all call sites for each defquery (in the module's `db.clj` and any other files)
4. For each call site:
   - If < 6 params: replace with `query-original-identifiers` / `execute!` + positional `?`
   - If >= 6 params: replace with `named-query` / `named-execute!` + `:named_params`
   - If `<!` query whose return value is used: add `RETURNING *` and use `first` + `query-original-identifiers`/`named-query`
   - If `!` query (no return value needed): use `execute!`/`named-execute!`
5. Check for `exec-all` usage — replace with explicit `with-tx`
6. Delete the defquery line
7. Delete the `.sql` file — **only if no other namespace references it** (check with grep)
8. Once all defqueries removed: delete the `queries.clj` namespace
9. Remove the `queries` require from calling namespaces
10. Run tests: `./lein with-profile test spec -f d`

### Identifying Call Patterns

The three calling patterns in current code:

1. **`(exec queries/fn params)`** — auto-transaction wrapper. Replace with 2-arity `query-original-identifiers`/`execute!` (which also auto-wraps in transaction via `with-tx`).

2. **`(queries/fn params {:connection tx})`** — inside existing transaction. Replace with 3-arity `query-original-identifiers tx`/`execute! tx` or `named-query tx`/`named-execute! tx`.

3. **`(exec-all [queries/fn1 params1 queries/fn2 params2])`** — multiple queries in one transaction. Replace with `(with-tx (fn [tx] ...))` and sequential calls.
