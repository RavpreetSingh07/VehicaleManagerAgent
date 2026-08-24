export function calculateDistance(
  previousKm: number,
  currentKm: number
) {
  const distance = currentKm - previousKm;

  return Math.max(distance, 0);
}

export function calculateMileage(
  previousKm: number,
  currentKm: number,
  fuelLitres: number
) {
  if (fuelLitres <= 0) {
    return 0;
  }

  const distance = calculateDistance(
    previousKm,
    currentKm
  );

  return Number((distance / fuelLitres).toFixed(2));
}

export function calculateNextServiceKm(
  lastServiceKm: number,
  serviceIntervalKm: number
) {
  return lastServiceKm + serviceIntervalKm;
}

export function calculateRemainingServiceKm(
  currentKm: number,
  nextServiceKm: number
) {
  return Math.max(nextServiceKm - currentKm, 0);
}

export function calculateTotalExpenses(
  fuel: number,
  service: number,
  repairs: number,
  other: number
) {
  return Number(
    (fuel + service + repairs + other).toFixed(2)
  );
}