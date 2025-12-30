(ns oph.va.decision-liitteet)

(def Liitteet
  [{:group "Oikaisuvaatimusosoitus"
    :attachments [{:id       "3a_oikaisuvaatimusosoitus_valtionavustuslaki"
                   :langs    {:fi "Oikaisuvaatimusosoitus"
                              :sv "Rättelseyrkande"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}]}
                  {:id       "3b_oikaisuvaatimusosoitus_laki_vapaasta_sivistystyosta"
                   :langs    {:fi "Oikaisuvaatimusosoitus"
                              :sv "Rättelseyrkande"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}]}
                  {:id       "3c_oikaisuvaatimusosoitus_laki_opetus_ja_kulttuuritoimen_rahoituksesta"
                   :langs    {:fi "Oikaisuvaatimusosoitus"
                              :sv "Rättelseyrkande"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}]}]}
   {:group "Valtionavustusten yleisohje"
    :attachments [{:id       "va_yleisohje"
                   :langs    {:fi "Valtionavustusten yleisohje"
                              :sv "Allmänna anvisningar om statsunderstöd"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}
                              {:id          "_2018-03"
                               :description "Voimassa 12.3.2018 alkaen"}
                              {:id          "_2020-12"
                               :description "Voimassa 17.12.2020 alkaen"}
                              {:id          "_2021-05"
                               :description "Voimassa 11.5.2021 alkaen"}
                              {:id          "_2022-09"
                               :description "Voimassa 13.9.2022 alkaen"}
                              {:id          "_2023-05"
                               :description "Voimassa 15.5.2023 alkaen"}]}

                  {:id       "jotpa_vakioehdot"
                   :langs    {:fi "JOTPA: Valtionavustusten vakioehdot"
                              :sv "Skols: Standardvillkor för statsunderstöd"}
                   :versions [{:id          "_2024-03-01"
                               :description "Voimassa 21.3.2024"}]}]}])

(def PakoteOhjeLiitteet
  {:id    "va_pakoteohje"
   :langs
   {:fi "Pakotteiden huomioon ottaminen valtionavustustoiminnassa"
    :sv "Beaktande av sanktioner i statsunderstödsverksamheten"}})
