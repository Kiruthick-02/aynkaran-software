export const USE_FORMATTED_TRAINEE_ID = true;

export const getTraineeIdPrefix = (date = new Date()) =>
  `TR${String(date.getFullYear()).slice(-2)}`;
