export interface Muutoshakemus {
  id: number;
  "hakemus-id": number;
  "haen-kayttoajan-pidennysta": boolean;
  "kayttoajan-pidennys-perustelut"?: string;
  "haettu-kayttoajan-paattymispaiva"?: string;
  "created-at": Date;
  "paatos-sent-at"?: Date;
}
