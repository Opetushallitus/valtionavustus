# Interactive development (REPL)

Leiningen uses checkout dependencies for soresu-form and common libraries, enabling live code reloading.

## Connecting to Running REPL

The backend server runs an nREPL server on port 7999 (inside the Docker container). Connect to it:

```bash
./lein repl :connect localhost:7999
```

Or use the convenience script:
```bash
./repl-connect.sh
```

## Modifying Code via REPL

You can modify running code without restarting the server - this is one of the most powerful features of Clojure development:

**Interactive approach:**
```clojure
;; 1. Switch to the namespace you want to modify
(in-ns 'oph.va.virkailija.routes)

;; 2. Redefine a function
(defn- on-healthcheck []
  (log/info "Modified via REPL!")
  (if (virkailija-db/health-check)
    (ok {:status "healthy" :modified-via "repl"})
    (not-found)))

;; The function is now updated in the running application!
```

**Non-interactive (scripted) approach:**
```bash
cat << 'EOF' | ./lein repl :connect localhost:7999
(in-ns 'oph.va.virkailija.routes)
(defn- my-function []
  (println "Updated function"))
(println "Function updated!")
EOF
```

**Important considerations:**
- Changes made via REPL are **not persisted** to source files
- After testing in REPL, remember to update the actual source files
- REPL changes are lost when the server restarts
- Changing soresu/common code requires re-evaluating dependent namespaces
- Private functions (defined with `defn-`) can still be redefined via REPL

