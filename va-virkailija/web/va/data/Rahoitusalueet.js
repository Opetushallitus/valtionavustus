const List = [
  {title: "Yleissivistävä koulutus, ml. varhaiskasvatus", type: "othk"},
  {title: "Ammatillinen koulutus", type: "othk"},
  {title: "Aikuiskoulutus ja vapaa sivistystyö", type: "othk"},
  {title: "Koko opetustoimi", type: "othk"},
  {title: "Kansalaisopisto", type: "momentti"},
  {title: "Kansanopisto", type: "momentti"},
  {title: "Opintokeskus", type: "momentti"},
  {title: "Kesäyliopisto", type: "momentti"},
  {title: "Poikkeus", type: "momentti"}
]

const mapTitle = (r)=>r.title

export default List.map(mapTitle)

export const Momentti = List.filter((r)=>r.type=="momentti").map(mapTitle)