(ns oph.va.decision-liitteet)

(def Liitteet
  [{:group "Ehdot"
    :attachments [{:id       "2a_ehdot_ja_rajoitukset_eritysavustus"
                   :langs    {:fi "Eritysavustukseen liittyvät ehdot ja rajoitukset"
                              :sv "Villkor och begränsningar för specialunderstöd"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}
                              {:id          "_2017-11"
                               :description "Voimassa 6.11.2017 alkaen"}]}
                  {:id       "2b_ehdot_ja_rajoitukset_yleisavustus"
                   :langs    {:fi "Yleisavustukseen liittyvät ehdot ja rajoitukset"
                              :sv "Villkor och begränsningar för allmänt understöd"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}
                              {:id          "_2017-10"
                               :description "Voimassa 16.10.2017 alkaen"}]}]}
   {:group "Oikaisuvaatimusosoitus"
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
                               :description "Voimassa 21.3.2024"}]}]}
   ])

(def PakoteOhjeLiitteet
  {:id    "va_pakoteohje"
   :langs
   {:fi "Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen valtionavustustoiminnassa"
    :sv "Beaktande av sanktioner i anslutning till Rysslands attack mot Ukraina"
    }
   })
