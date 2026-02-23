export const MEXICAN_BEERS = [
  // Mainstream
  { name: "Corona Extra", brand: "Grupo Modelo", abv: 4.5 },
  { name: "Corona Light", brand: "Grupo Modelo", abv: 3.7 },
  { name: "Modelo Especial", brand: "Grupo Modelo", abv: 4.4 },
  { name: "Modelo Negra", brand: "Grupo Modelo", abv: 5.4 },
  { name: "Tecate", brand: "Cuauhtémoc Moctezuma", abv: 4.5 },
  { name: "Tecate Light", brand: "Cuauhtémoc Moctezuma", abv: 3.9 },
  { name: "Dos Equis Lager", brand: "Cuauhtémoc Moctezuma", abv: 4.2 },
  { name: "Dos Equis Ambar", brand: "Cuauhtémoc Moctezuma", abv: 4.7 },
  { name: "Pacífico", brand: "Grupo Modelo", abv: 4.5 },
  { name: "Sol", brand: "Cuauhtémoc Moctezuma", abv: 4.5 },
  { name: "Victoria", brand: "Grupo Modelo", abv: 4.0 },
  { name: "Bohemia Clara", brand: "Cuauhtémoc Moctezuma", abv: 4.8 },
  { name: "Bohemia Oscura", brand: "Cuauhtémoc Moctezuma", abv: 5.3 },
  { name: "Bohemia Weizen", brand: "Cuauhtémoc Moctezuma", abv: 5.1 },
  { name: "León", brand: "Cuauhtémoc Moctezuma", abv: 4.5 },
  { name: "Indio", brand: "Cuauhtémoc Moctezuma", abv: 4.1 },
  { name: "Montejo", brand: "Grupo Modelo", abv: 4.0 },
  { name: "Superior", brand: "Cuauhtémoc Moctezuma", abv: 4.5 },
  { name: "Carta Blanca", brand: "Cuauhtémoc Moctezuma", abv: 4.5 },
  { name: "Estrella", brand: "Regional", abv: 4.5 },
  // Craft
  { name: "Minerva Pale Ale", brand: "Minerva", abv: 5.0 },
  { name: "Minerva IPA", brand: "Minerva", abv: 6.5 },
  { name: "Minerva Stout", brand: "Minerva", abv: 5.0 },
  { name: "Cucapá Chupacabras", brand: "Cucapá", abv: 5.8 },
  { name: "Cucapá Honey", brand: "Cucapá", abv: 5.0 },
  { name: "Cucapá Runaway IPA", brand: "Cucapá", abv: 6.5 },
  { name: "Tempus Doble Malta", brand: "Tempus", abv: 8.0 },
  { name: "Wendlandt Golden Ale", brand: "Wendlandt", abv: 5.0 },
  { name: "Colimita", brand: "Cervecería de Colima", abv: 4.5 },
  { name: "Ramuri", brand: "Ramuri", abv: 4.8 },
] as const;

export const CONTAINER_TYPES = [
  { id: "can_325ml", label: "Can 325ml", emoji: "🥫", volume_ml: 325 },
  { id: "can_355ml", label: "Can 355ml (12oz)", emoji: "🥫", volume_ml: 355 },
  { id: "can_473ml", label: "Can 473ml (Tallboy)", emoji: "🥫", volume_ml: 473 },
  { id: "can_710ml", label: "Can 710ml (24oz)", emoji: "🥫", volume_ml: 710 },
  { id: "bottle_355ml", label: "Bottle 355ml", emoji: "🍺", volume_ml: 355 },
  { id: "caguama", label: "Caguama 940ml", emoji: "🐢", volume_ml: 940 },
  { id: "ballena", label: "Ballena 1.2L", emoji: "🐳", volume_ml: 1200 },
  { id: "draft_pint", label: "Draft Pint", emoji: "🍻", volume_ml: 473 },
  { id: "draft_half", label: "Draft Half", emoji: "🍻", volume_ml: 237 },
  { id: "40oz", label: "40oz", emoji: "💀", volume_ml: 1182 },
] as const;

export type Beer = (typeof MEXICAN_BEERS)[number];
export type ContainerType = (typeof CONTAINER_TYPES)[number];

export const BRAND_META: Record<string, { color: string; abbr: string; logo?: string }> = {
  "Grupo Modelo": {
    color: "#1a6b3a",
    abbr: "GM",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Modelo_Especial_bottle.jpg/100px-Modelo_Especial_bottle.jpg"
  },
  "Cuauhtémoc Moctezuma": {
    color: "#c8a020",
    abbr: "CM",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Tecate_lata.jpg/100px-Tecate_lata.jpg"
  },
  "Minerva": { color: "#7c3aed", abbr: "MN" },
  "Cucapá": { color: "#0891b2", abbr: "CU" },
  "Tempus": { color: "#dc2626", abbr: "TP" },
  "Wendlandt": { color: "#059669", abbr: "WE" },
  "Cervecería de Colima": { color: "#ea580c", abbr: "CC" },
  "Ramuri": { color: "#be185d", abbr: "RA" },
  "Regional": { color: "#64748b", abbr: "RE" },
};

export const BEER_LOGOS: Record<string, string> = {
  "Corona Extra": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Corona_Extra_beer_bottle.jpg/80px-Corona_Extra_beer_bottle.jpg",
  "Modelo Especial": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Modelo_Especial.jpg/80px-Modelo_Especial.jpg",
  "Pacífico": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Cerveza_Pac%C3%ADfico.jpg/80px-Cerveza_Pac%C3%ADfico.jpg",
  "Tecate": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Cerveza_Tecate.jpg/80px-Cerveza_Tecate.jpg",
};

// Get unique brands for filter chips
export const BEER_BRANDS = [...new Set(MEXICAN_BEERS.map(b => b.brand))] as string[];
