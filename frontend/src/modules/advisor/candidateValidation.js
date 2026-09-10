const namePattern = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
const phonePattern = /^\d+$/;
const pincodePattern = /^\d{6}$/;

export function validateCandidateFields(candidate) {
  const name = String(candidate.name || '').trim();
  const mobile = String(candidate.mobile || '').trim();
  const email = String(candidate.email || '').trim();
  const alternateMobile = String(candidate.alternateMobile || '').trim();
  const address = String(candidate.address || '').trim();
  const city = String(candidate.city || '').trim();
  const pincode = String(candidate.pincode || '').trim();

  if (!namePattern.test(name)) return 'Enter a valid name using letters, spaces, apostrophes, or hyphens.';
  if (!phonePattern.test(mobile) || mobile.length < 10 || mobile.length > 15) return 'Enter a valid mobile number with 10 digits.';
  if (alternateMobile && (!phonePattern.test(alternateMobile) || alternateMobile.length < 10 || alternateMobile.length > 15)) return 'Enter a valid alternate mobile number.';
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.';
  if (address && (address.length < 3 || address.length > 200)) return 'Address must be between 3 and 200 characters.';
  if (city && !/^[A-Za-z .'-]{2,80}$/.test(city)) return 'Enter a valid city.';
  if (pincode && !pincodePattern.test(pincode)) return 'Pincode must contain exactly 6 digits.';
  if (candidate.dateOfBirth && new Date(candidate.dateOfBirth) > new Date()) return 'Date of birth cannot be in the future.';
  return null;
}