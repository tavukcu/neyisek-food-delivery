// 🇹🇷 Türkiye İller ve İlçeler Veri Seti
export interface District {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  plateCode: string;
  districts: District[];
}

export const TURKISH_CITIES: City[] = [
  {
    id: "45",
    name: "Manisa",
    plateCode: "45",
    districts: [
      { id: "45-01", name: "Ahmetli" },
      { id: "45-02", name: "Akhisar" },
      { id: "45-03", name: "Alaşehir" },
      { id: "45-04", name: "Demirci" },
      { id: "45-05", name: "Gölmarmara" },
      { id: "45-06", name: "Gördes" },
      { id: "45-07", name: "Kırkağaç" },
      { id: "45-08", name: "Köprübaşı" },
      { id: "45-09", name: "Kula" },
      { id: "45-10", name: "Salihli" },
      { id: "45-11", name: "Sarıgöl" },
      { id: "45-12", name: "Saruhanlı" },
      { id: "45-13", name: "Selendi" },
      { id: "45-14", name: "Soma" },
      { id: "45-15", name: "Şehzadeler" },
      { id: "45-16", name: "Turgutlu" },
      { id: "45-17", name: "Yunusemre" }
    ]
  }
];

// 🔍 UTILITY FUNCTIONS
export const getCityById = (cityId: string): City | undefined => {
  return TURKISH_CITIES.find(city => city.id === cityId);
};

export const getDistrictById = (cityId: string, districtId: string): District | undefined => {
  const city = getCityById(cityId);
  return city?.districts.find(district => district.id === districtId);
};

export const getDistrictsByCity = (cityId: string): District[] => {
  const city = getCityById(cityId);
  return city?.districts || [];
};

// 🌟 POPULAR CITIES for quick selection (sadece Manisa)
export const POPULAR_CITIES = [
  "45"  // Manisa
]; 