// Райони Житомирської області з приблизними межами
export const zhytomyrRegionBorder = {
  "type": "Feature",
  "properties": {
    "name": "Житомирська область"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [27.3334, 50.6425],
      [27.5, 50.55],
      [27.8, 50.45],
      [28.1, 50.35],
      [28.5, 50.25],
      [28.9, 50.22],
      [29.3, 50.25],
      [29.5851, 50.35],
      [29.6, 50.6],
      [29.55, 50.9],
      [29.5, 51.1],
      [29.4, 51.35],
      [29.3, 51.5],
      [29.1, 51.68],
      [28.8, 51.7],
      [28.5, 51.68],
      [28.2, 51.65],
      [27.9, 51.6],
      [27.6, 51.5],
      [27.4, 51.35],
      [27.35, 51.1],
      [27.3334, 50.6425]
    ]]
  }
};

export const districts = [
  {
    id: "zhytomyr",
    name: "Житомирський район",
    color: "#10b981", // emerald
    center: [50.25, 28.65],
    bounds: {
      "type": "Feature",
      "properties": { "name": "Житомирський район", "id": "zhytomyr" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [28.0, 50.0],
          [28.0, 50.55],
          [29.0, 50.55],
          [29.4, 50.6],
          [29.55, 50.35],
          [29.3, 50.25],
          [28.9, 50.22],
          [28.5, 50.25],
          [28.1, 50.15],
          [28.0, 50.0]
        ]]
      }
    }
  },
  {
    id: "berdychiv",
    name: "Бердичівський район",
    color: "#f59e0b", // amber
    center: [49.9, 28.6],
    bounds: {
      "type": "Feature",
      "properties": { "name": "Бердичівський район", "id": "berdychiv" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [28.0, 49.5],
          [28.0, 50.0],
          [28.1, 50.15],
          [28.5, 50.25],
          [28.9, 50.22],
          [29.3, 50.25],
          [29.5851, 50.0],
          [29.5, 49.5],
          [29.0, 49.5],
          [28.5, 49.5],
          [28.0, 49.5]
        ]]
      }
    }
  },
  {
    id: "korosten",
    name: "Коростенський район",
    color: "#3b82f6", // blue
    center: [50.95, 28.65],
    bounds: {
      "type": "Feature",
      "properties": { "name": "Коростенський район", "id": "korosten" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [28.0, 50.55],
          [28.0, 51.2],
          [28.2, 51.4],
          [28.5, 51.5],
          [28.8, 51.55],
          [29.1, 51.68],
          [29.4, 51.55],
          [29.5, 51.2],
          [29.55, 50.9],
          [29.4, 50.6],
          [29.0, 50.55],
          [28.0, 50.55]
        ]]
      }
    }
  },
  {
    id: "zvyahel",
    name: "Звягельський район",
    color: "#8b5cf6", // violet
    center: [50.6, 27.6],
    bounds: {
      "type": "Feature",
      "properties": { "name": "Звягельський район", "id": "zvyahel" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [27.3334, 50.6425],
          [27.35, 51.1],
          [27.4, 51.35],
          [27.6, 51.5],
          [27.9, 51.6],
          [28.2, 51.4],
          [28.0, 51.2],
          [28.0, 50.55],
          [28.0, 50.0],
          [27.8, 50.15],
          [27.5, 50.35],
          [27.3334, 50.6425]
        ]]
      }
    }
  }
];

// Функція для визначення району за координатами
export const getDistrictByCoords = (lat, lng) => {
  // Спрощена логіка визначення району за координатами
  if (lng >= 28.0 && lat <= 50.55 && lat >= 50.0) {
    return "zhytomyr";
  } else if (lng >= 28.0 && lat < 50.0) {
    return "berdychiv";
  } else if (lng >= 28.0 && lat > 50.55) {
    return "korosten";
  } else if (lng < 28.0) {
    return "zvyahel";
  }
  return "zhytomyr"; // default
};

export const districtColors = {
  zhytomyr: "#10b981",
  berdychiv: "#f59e0b",
  korosten: "#3b82f6",
  zvyahel: "#8b5cf6"
};

export const districtNames = {
  zhytomyr: "Житомирський район",
  berdychiv: "Бердичівський район",
  korosten: "Коростенський район",
  zvyahel: "Звягельський район"
};
