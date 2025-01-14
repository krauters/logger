/* eslint-disable @typescript-eslint/naming-convention */
export const SensitivePatterns = {
	Address: /^\d{1,5}\s[A-Za-z]{2,}\s(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Lane|Ln|Drive|Dr)$/,
	BankAccountNumber: /^\d{9,18}$/,
	BankRoutingNumber: /^\d{9}$/,
	BiometricData: /^BiometricID:\s?[A-Z0-9]{8}$/,
	CitizenId: /^CID\s?\d{10}$/,

	/**
	 * CreditCard:
	 * - Matches both standard and non-standard groupings:
	 *   - Standard: 4-4-4-4, 5-4-4-4, 3-6-5, 6-4-4-4
	 *   - Non-Standard: 4-4-4-3, 4-4-4-2
	 * - Allows optional separators: spaces or dashes
	 * - Accepts continuous digits ranging from 13 to 16
	 */
	CreditCard: /^(?:\d{4}[- ]?){3}\d{2,4}$|^\d{13,16}$/,
	CreditScore: /^(?:[3-9]\d{2}|1000)$/,
	// eslint-disable-next-line no-useless-escape
	Dob: /^(0[1-9]|1[0-2])[\/.-](0[1-9]|[12]\d|3[01])[\/.-]\d{4}$/,
	DriversLicense: /^[A-Z]\d{7}$/,
	Email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
	EmployeeId: /^EID\s?\d{6}$/,
	GovernmentId: /^GID\s?\d{8}$/,
	HealthInsuranceNumber: /^HIN\s?\d{10}$/,
	InsurancePolicyNumber: /^IPN\s?\d{12}$/,
	IpAddress: /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/,
	LinkedInId: /^LIID\s?[A-Za-z0-9]{10}$/,
	MedicalLicense: /^ML\d{5,6}$/,
	MedicalRecordNumber: /^MRN\s?\d{6}$/,
	NationalId: /^NID\s?\d{10}$/,
	PassportSeriesNumber: /^PSN\s?\d{9}$/,
	Password: /^password:\s+\S+$/,
	PersonalIdentificationNumber: /^PIN\s?\d{4,6}$/,
	PersonalTaxCode: /^PTC\s?\d{11}$/,
	PhoneNumber: /^\d{3}[-.]?\d{3}[-.]?\d{4}$/,
	SsinitNumber: /^SSNIT\s?\d{11}$/,
	Ssn: /^\d{3}-\d{2}-\d{4}$/,
	StudentId: /^SID\s?\d{8}$/,
	TaxIdentificationNumber: /^TIN\s?\d{9}$/,
	TelecomCustomerId: /^TCID\s?\d{10}$/,
} as const
