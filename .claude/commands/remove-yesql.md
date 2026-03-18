Remove yesql indirection from a query module by inlining SQL into calling functions.

## Usage

Provide the module to migrate as an argument: $ARGUMENTS

Example: `/remove-yesql oph.va.hakija.api.queries`

## Design Reference

Full design spec: `docs/superpowers/specs/2026-03-18-remove-yesql-indirection-design.md`

## Process

### 1. Read the queries namespace

Read the `queries.clj` file for the given module. Extract:
- Every `defquery` name and its SQL file path
- Note which use `<!` suffix (insert-handler, returns row) vs `!` suffix (execute-handler, returns count) vs plain (query-handler, returns rows)

### 2. Read every SQL file

Read each `.sql` file referenced by the defqueries. Record the exact SQL.

### 3. Find all call sites

For each defquery function, grep the entire `server/src/` tree to find every call site. Track:
- Which file and line calls it
- Whether it uses `(exec queries/fn params)` pattern (auto-transaction)
- Whether it uses `(queries/fn params {:connection tx})` pattern (existing transaction)
- Whether it uses `(exec-all [...])` pattern (multi-query transaction)
- Whether the return value is used (check what callers do with the result)

### 4. Categorize each query

**Parameter count determines the replacement function:**
- **< 6 params**: Use `query-original-identifiers` / `execute!` with positional `?`
- **>= 6 params**: Use `named-query` / `named-execute!` with `:named_params` and a map

**Return value determines the query function:**
- SELECT queries → `query-original-identifiers` or `named-query`
- `<!` queries where return value IS used → `query-original-identifiers` or `named-query` with `RETURNING *`, wrapped in `(first ...)`
- `<!` queries where return value is NOT used → `execute!` or `named-execute!`
- `!` queries (fire-and-forget) → `execute!` or `named-execute!`

**Transaction context determines arity:**
- `(exec queries/fn params)` → use 2-arity (auto-wraps in transaction)
- `(queries/fn params {:connection tx})` → use 3-arity with `tx` as first arg
- `(exec-all [...])` → replace with explicit `(with-tx (fn [tx] ...))` and sequential calls

### 5. Check for dead code

If a defquery has zero call sites, it's dead code. Delete it without replacement.

### 6. Check for IN-list parameters

Yesql supports `IN (:param)` with list/vector values, auto-expanding to multiple `?`. If any SQL uses this pattern:
- Replace with PostgreSQL `= ANY(?)` and pass the collection as a JDBC array
- Or add list expansion logic to the SQL string manually

### 7. Implement replacements

Work through each query, replacing the call site with inline SQL. Commit in logical groups (e.g., by domain: avustushaku queries, hakemus queries, attachment queries, etc.).

### 8. Clean up

- Remove the `queries` require/alias from the calling namespace
- Remove `exec` / `exec-all` from imports if no longer used
- Delete the `queries.clj` file
- Delete `.sql` files — **ONLY if no other namespace references them** (grep first!)
- Clean up empty directories

### 9. Verify

- Run `./lein compile <modified.namespace>` to check compilation
- Run `./lein cljfmt fix` on changed files
- Hot-reload via nREPL: `(require '<namespace> :reload)`
- Smoke test relevant API endpoints

## Critical Rules

1. **ALWAYS use `query-original-identifiers`** (not `query`) to preserve `:underscore_keys`. Using `query` silently converts to `:dashed-keys` and breaks all downstream accessors.

2. **ALWAYS wrap `<!` replacements with `(first ...)`** when the return value is used. Yesql's insert-handler returns a single map; `query-original-identifiers`/`named-query` return a sequence.

3. **ALWAYS add `RETURNING *`** (or specific columns) to INSERT/UPDATE SQL when the return value is needed.

4. **NEVER delete shared SQL files** until ALL modules referencing them are migrated. Check with: `grep -r "filename.sql" server/src/`

5. **The `named-query` regex uses `(?!:)` negative lookahead** to avoid matching PostgreSQL `::` type casts. This is already handled in the helper — don't work around it.

6. **Parameter order matters** for positional `?` queries. Match the order of `?` placeholders to the SQL column order, not the order params appear in the original map.

## Remaining Modules

- `oph.va.hakija.api.queries` — has IN-list expansion queries
- `oph.va.virkailija.db.queries`
- `oph.va.virkailija.db.external_queries`
- `oph.soresu.form.db.queries`
- `oph.soresu.common.db.queries`

After ALL modules are done:
- Remove `[yesql "0.5.4"]` from `project.clj`
- Remove `exec` and `exec-all` macros from `oph.soresu.common.db` (if unused)
