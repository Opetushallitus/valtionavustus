(ns oph.va.virkailija.rondo-service-spec
  (:require [speclj.core
             :refer [describe it should tags]]
            [oph.va.virkailija.rondo-service :refer [rondo-service]]))


(defrecord TestFileService [config]
        RemoteFileService
                  (get-remote-file-list [_] (...))
                  (do-sftp! [_] (...))
                  (send-to-rondo! [_] (s...))


(tags :rondoservice)

(describe "Testing Rondo Service functions"
  (tags :rondoservice)
          (it "gets list of files in remote server"
              (let [result (rget-remote-file-list config (fn [x] (str (:remote_path_from x))))]
                (should= result (:token (first revoked-tokens))))) )
