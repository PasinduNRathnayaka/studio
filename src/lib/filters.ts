export type Filter = (imageData: ImageData) => ImageData;

const grayscale: Filter = (imageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg; // red
    data[i + 1] = avg; // green
    data[i + 2] = avg; // blue
  }
  return imageData;
};

const sepia: Filter = (imageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
  return imageData;
};

const vintage: Filter = (imageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1);
        data[i+1] = Math.min(255, data[i+1] * 1.05);
        data[i+2] = data[i+2] * 0.8;
        
        data[i] *= 0.95;
        data[i + 1] *= 0.95;
        data[i + 2] *= 0.95;
    }
    return sepia(imageData);
};

const cool: Filter = (imageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.9;
        data[i + 1] = Math.min(255, data[i + 1] * 1.05);
        data[i + 2] = Math.min(255, data[i + 2] * 1.2);
    }
    return imageData;
};


const warm: Filter = (imageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.2);
        data[i + 1] = Math.min(255, data[i + 1] * 1.05);
        data[i + 2] = data[i + 2] * 0.9;
    }
    return imageData;
};


const noir: Filter = (imageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
    return imageData;
};

export const filters: Record<string, Filter> = {
  grayscale,
  sepia,
  vintage,
  cool,
  warm,
  noir
};

export const findFilter = (name: string): Filter | null => {
  const lowerName = name.toLowerCase();
  for (const key in filters) {
    if (lowerName.includes(key)) {
      return filters[key];
    }
  }
  if (lowerName.includes('black and white') || lowerName.includes('monochrome')) {
    return grayscale;
  }
  return null;
};
