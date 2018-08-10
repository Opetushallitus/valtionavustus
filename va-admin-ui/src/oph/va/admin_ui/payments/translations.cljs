(ns oph.va.admin-ui.translations)

(def ^:private translations
  {:batch-modify-not-allowed
   {:fi "Olemassaolevan maksuerän tietoja ei voi muokata"}
   :set-paid
   {:fi "Aseta maksetuksi"}
   :set-paid-without-sending
   {:fi "Aseta maksatukset maksetuksi lähettämättä niitä Rondoon"}})

(defn translate
  ([lng s] (get-in translations [s lng]))
  ([s] (translate :fi s)))
