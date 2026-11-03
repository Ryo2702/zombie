// Reference readings are fictional visual cues, not a physiological model.
export const vitalKeyframes = [
  [0, 72, 98, 37, 1], [9, 76, 98, 37, 1], [12, 78, 98, 37, 1],
  [15, 82, 93, 37, 1], [18, 85, 86, 37, 1], [21, 117, 84, 40.1, 1],
  [24, 128, 84, 41.2, 1], [27, 132, 84, 41.6, 1], [33, 132, 84, 41.6, 1],
  [36, 144, 71, 41.6, 2], [42, 41, 58, 41.6, 2], [45, 0, null, 41.6, 2],
  [48, 70, null, 36.7, 2], [51, 188, null, 31.8, 2], [54, 188, null, 31.8, 8],
  [57, 188, null, 31.8, 80], [60, 240, null, 31.8, 308], [67, 240, null, 31.8, 308],
].map(([time, hr, spo2, temp, infected]) => ({ time, hr, spo2, temp, infected }));
