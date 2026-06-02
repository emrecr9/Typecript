/**
 * Calculates a deterministic mocked hourly pay rate for a shift based on its ID and workplace ID.
 *
 * @param shiftId - The unique identifier of the shift
 * @param workplaceId - The unique identifier of the workplace
 * @returns A pay rate between 25.00 and 40.00, in increments of 0.25
 */
export function mockHourlyPay(shiftId: number, workplaceId: number): number {
  // Create a deterministic input string using both IDs
  const input = `${shiftId}-${workplaceId}`;

  // Use btoa (base64 encoding) to create a deterministic string, then convert to number
  const base64 = btoa(input);
  // Sum up character codes from the base64 string for a simple numeric hash
  const hashInt = Array.from(base64).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  // Define the pay range
  const minPay = 25.0;
  const maxPay = 40.0;
  const increment = 0.25;

  // Calculate the number of possible pay values
  const numSteps = Math.floor((maxPay - minPay) / increment) + 1; // +1 to include maxPay

  // Map the hash to one of the possible pay values
  const stepIndex = hashInt % numSteps;
  const hourlyPay = minPay + stepIndex * increment;

  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round(hourlyPay * 100) / 100;
}
