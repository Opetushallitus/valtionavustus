(ns oph.va.virkailija.payment-batches-data
  (:require [oph.soresu.common.db :refer [execute! named-query
                                          query-original-identifiers]]
            [clojure.tools.logging :as log]
            [oph.va.virkailija.utils
             :refer [convert-to-dash-keys convert-to-underscore-keys
                     with-timeout]]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.remote-file-service :refer [send-payment-to-rondo!]]
            [oph.va.virkailija.invoice :as invoice]
            [clj-time.core :as t]
            [clj-time.format :as f]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.tasmaytysraportti :as tasmaytysraportti]))

(def date-formatter (f/formatter "dd.MM.YYYY"))

(def timeout-limit 10000)

(defn find-batches [grant-id]
  (->> (query-original-identifiers
        "SELECT id, created_at, batch_number, invoice_date, due_date,
                receipt_date, currency, partner, grant_id
         FROM virkailija.payment_batches
         WHERE created_at >= TIMESTAMP 'today' AND grant_id = ?
         ORDER BY id DESC"
        [grant-id])
       (map convert-to-dash-keys)
       (map payments-data/convert-timestamps-from-sql)))

(defn create-batch [values]
  (->> values
       convert-to-underscore-keys
       (named-query
        "INSERT INTO virkailija.payment_batches
           (batch_number, invoice_date, due_date, receipt_date, currency, partner, grant_id)
         VALUES
           ((SELECT GREATEST(MAX(batch_number), 0) + 1
             FROM virkailija.payment_batches
             WHERE date_part('year', created_at) = date_part('year', CURRENT_DATE)),
            :invoice_date, :due_date, :receipt_date, :currency, :partner, :grant_id)
         RETURNING id, batch_number, invoice_date, due_date, receipt_date,
                   currency, partner, grant_id")
       first
       convert-to-dash-keys
       payments-data/convert-timestamps-from-sql))

(defn get-batch [id]
  (-> (query-original-identifiers
       "SELECT id, created_at, batch_number, invoice_date, due_date,
               receipt_date, currency, partner, grant_id
        FROM virkailija.payment_batches WHERE id = ?"
       [id])
      first
      convert-to-dash-keys
      payments-data/convert-timestamps-from-sql))

(defn- inc-sent-count! [batch-id]
  (execute!
   "UPDATE virkailija.payment_batches SET sent_count = sent_count + 1 WHERE id = ?"
   [batch-id]))

(defn- mark-send-finished!
  "Writes the terminal status. The maksuera succeeded only if the job did not throw AND every
   maksatus went out. The count alone is not enough: a throw after the payment loop - in the
   maksatus emails or the tasmaytysraportti - leaves every maksatus sent, so the counts would
   match while the notifications never went."
  [batch-id failed?]
  (execute!
   "UPDATE virkailija.payment_batches
       SET send_status = CASE
             WHEN ? OR sent_count <> total_count THEN 'failed'
             ELSE 'completed' END
     WHERE id = ?"
   [failed? batch-id]))

(defn fail-stale-sending-batches!
  "At startup no maksuera can genuinely be sending, because there is a single instance
   (cdk/lib/va-service-stack.ts:182). An era left mid-flight is marked failed so the UI stops
   claiming a send is in progress.

   Without this the era would stay 'sending' forever: the polling hook only reschedules while the
   status is 'sending', so the page would poll every two seconds indefinitely, show a frozen
   progress counter and keep the send button disabled. Nothing else would clear it - there is no
   resume, and create-payment-batch refuses a second era for the same grant on the same day."
  []
  (execute!
   "UPDATE virkailija.payment_batches
       SET send_status = 'failed'
     WHERE send_status = 'sending'"
   []))

(defn get-batch-send-status [batch-id]
  (some-> (query-original-identifiers
           "SELECT id, send_status, sent_count, total_count
              FROM virkailija.payment_batches WHERE id = ?"
           [batch-id])
          first
          convert-to-dash-keys))

(defn create-filename
  ([payment id-gen-fn] (format "payment-%d-%d.xml" (:id payment) (id-gen-fn)))
  ([payment] (create-filename payment  #(System/currentTimeMillis))))

(defn send-to-rondo! [payment application grant filename batch]
  (let [rondo-service (rondo-service/create-service
                       (get-in config [:server :payment-service-sftp]))]
    (with-timeout
      #(try
         (send-payment-to-rondo! rondo-service
                                 {:payment (payments-data/get-payment (:id payment))
                                  :application application
                                  :grant grant
                                  :filename filename
                                  :batch batch})
         (catch Exception e
           {:success false :error {:error-type :exception :exception e}}))
      timeout-limit {:success false :error {:error-type :timeout}})))

(defn send-payment [payment application data]
  (let [filename (create-filename payment)
        projectCode (or (:project-code payment) (:project-code application))
        updated-payment (payments-data/update-payment
                         (assoc payment :batch-id (get-in data [:batch :id])
                                :project-code projectCode)
                         (:identity data))]
    (-> updated-payment
        (send-to-rondo! application (:grant data) filename (:batch data))
        (assoc
         :filename filename
         :payment (payments-data/get-payment (:id updated-payment) (:version updated-payment))))))

(defn- payments-to-send
  "The maksatukset to send, each with its hakemus. Picks up only maksatukset that have not been
   sent yet (paymentstatus 'created' or 'waiting'), so a maksatus already in Rondo is never
   picked up again."
  [grant-id]
  (for [application (filter payments-data/valid-for-send-payment?
                            (grant-data/get-grant-applications-with-evaluation grant-id))
        payment (application-data/get-application-unsent-payments (:id application))]
    {:application application :payment payment}))

(defn set-payments-paid [{:keys [identity grant-id]}]
  (doseq [application
          (filter
           payments-data/valid-for-send-payment?
           (grant-data/get-grant-applications-with-evaluation grant-id))]
    (doseq [payment
            (application-data/get-application-unsent-payments
             (:id application))]
      (payments-data/update-payment
       (assoc payment :paymentstatus-id "paid" :filename "") identity)
      (application-data/revoke-application-tokens
       (:id application)))))

(defn get-batch-documents [batch-id]
  (->> (query-original-identifiers
        "SELECT id, created_at, document_id, phase, presenter_email, acceptor_email
         FROM virkailija.batch_documents
         WHERE batch_id = ? AND deleted IS NOT TRUE"
        [batch-id])
       (map convert-to-dash-keys)
       (map payments-data/convert-timestamps-from-sql)))

(defn create-batch-document [batch-id document]
  (->> (assoc document :batch-id batch-id)
       convert-to-underscore-keys
       (named-query
        "INSERT INTO virkailija.batch_documents
           (batch_id, document_id, phase, presenter_email, acceptor_email)
         VALUES (:batch_id, :document_id, :phase, :presenter_email, :acceptor_email)
         RETURNING id, created_at, document_id, phase, presenter_email, acceptor_email")
       first
       convert-to-dash-keys))

(defn create-batch-document-email
  [{:keys [grant batch document payments]}]
  {:receivers [(:presenter-email document) (:acceptor-email document)]
   :batch-key (invoice/get-batch-key batch grant)
   :title (get-in grant [:content :name])
   :date (f/unparse date-formatter (t/now))
   :count (count payments)
   :total-granted (reduce #(+ %1 (:payment-sum %2)) 0 payments)})

(defn send-batch-emails [batch-id]
  (let [batch (get-batch batch-id)
        grant (grant-data/get-grant (:grant-id batch))
        payments (payments-data/get-batch-payments batch-id)]
    (doseq [document (get-batch-documents batch-id)]
      (email/send-payments-info!
       (create-batch-document-email
        {:grant grant
         :batch batch
         :document document
         :payments (filter
                    #(= (:phase %) (:phase document))
                    payments)})))))

(defn- test-send-delay!
  "Test-only delay between maksatukset so browser tests can observe a send in progress. Gated on
   the :test-apis :enabled? flag like the test routes (routes.clj), so that accidentally copying
   the key into a production config cannot slow a real maksatus send."
  []
  (when (get-in config [:test-apis :enabled?])
    (when-let [delay-ms (get-in config [:test-apis :maksatus-send-delay-ms])]
      (Thread/sleep (long delay-ms)))))

(defn- run-send-job!
  "Sends the maksuera's maksatukset, the maksatus emails and the tasmaytysraportti. Writes progress
   and the terminal status onto the era's row so the state survives the process dying mid-flight.
   Never lets an exception reach the caller - an Error too (OutOfMemory while generating the
   tasmaytysraportti PDF/Excel, say) is captured before finally writes the terminal status."
  [{:keys [batch grant avustushaku-id identity] :as data}]
  (let [batch-id (:id batch)
        failed? (atom false)]
    (try
      (doseq [{:keys [application payment]} (payments-to-send (:id grant))]
        (test-send-delay!)
        (let [result (send-payment payment application data)]
          (if (:success result)
            (do
              (payments-data/update-payment
               (assoc (:payment result)
                      :paymentstatus-id "sent" :filename (:filename result)) identity)
              (application-data/revoke-application-tokens (:id application))
              (inc-sent-count! batch-id))
            ;; send-payment! can also return {:success false :value ...} with no :error key at
            ;; all (rondo_service.clj:78), so log whichever of the two is there.
            (log/error "Failed to send maksatus" (:id payment)
                       (pr-str (select-keys result [:error :value]))))))
      (send-batch-emails batch-id)
      (tasmaytysraportti/send-tasmaytysraportti
       avustushaku-id
       (tasmaytysraportti/get-tasmaytysraportti-by-avustushaku-id avustushaku-id))
      (catch Throwable e
        (reset! failed? true)
        (log/error e "Maksatus send job failed for batch" batch-id))
      (finally
        (mark-send-finished! batch-id @failed?)))))

(defn start-send-job!
  "Hands the send to a background thread. The UPDATE only succeeds if no send is already
   running for this era, so two requests arriving at the same time can't both start a job for
   the same era. It also initialises the row the UI polls: without a total there is nothing to
   divide by and no status to report. Returns true if this call started the job, false if a send
   was already running."
  [avustushaku-id batch-id identity]
  (let [batch (assoc (get-batch batch-id) :documents (get-batch-documents batch-id))
        grant (grant-data/get-grant (:grant-id batch))
        to-send (count (payments-to-send (:id grant)))
        started? (-> (execute!
                      "UPDATE virkailija.payment_batches
                          SET send_status = 'sending', sent_count = 0, total_count = ?
                        WHERE id = ? AND send_status IS DISTINCT FROM 'sending'"
                      [to-send batch-id])
                     first
                     (= 1))]
    (when started?
      (future
        ;; run-send-job! catches Throwable itself, but its catch and finally touch the database and
        ;; can throw in turn. A throwable escaping into a future is swallowed without a trace.
        (try
          (run-send-job! {:batch batch
                          :grant grant
                          :avustushaku-id avustushaku-id
                          :identity identity})
          (catch Throwable e
            (log/error e "Maksatus send job escaped for batch" batch-id)))))
    started?))

(defn- set-batch-documents [batch]
  (assoc batch :documents (get-batch-documents (:id batch))))

(defn get-grant-batches [grant-id]
  (->> (query-original-identifiers
        "SELECT id, created_at, batch_number, invoice_date, due_date,
                receipt_date, currency, partner, grant_id,
                send_status, sent_count, total_count
         FROM virkailija.payment_batches WHERE grant_id = ?"
        [grant-id])
       (map convert-to-dash-keys)
       (map payments-data/convert-timestamps-from-sql)
       (map set-batch-documents)))

