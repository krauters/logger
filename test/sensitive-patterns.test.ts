/* eslint-disable no-inline-comments */
/* eslint-disable max-lines */
import { SensitivePatterns } from '../src/sensitive-patterns'

// eslint-disable-next-line max-lines-per-function
describe('SensitivePatterns', () => {
	it('should have all expected patterns defined', () => {
		const expectedKeys = [
			'Address',
			'BankAccountNumber',
			'BankRoutingNumber',
			'BiometricData',
			'CitizenId',
			'CreditCard',
			'CreditScore',
			'Dob',
			'DriversLicense',
			'Email',
			'EmployeeId',
			'GovernmentId',
			'HealthInsuranceNumber',
			'InsurancePolicyNumber',
			'IpAddress',
			'LinkedInId',
			'MedicalLicense',
			'MedicalRecordNumber',
			'NationalId',
			'PassportSeriesNumber',
			'Password',
			'PersonalIdentificationNumber',
			'PersonalTaxCode',
			'PhoneNumber',
			'SsinitNumber',
			'Ssn',
			'StudentId',
			'TaxIdentificationNumber',
			'TelecomCustomerId',
		]

		const actualKeys = Object.keys(SensitivePatterns)
		expect(actualKeys.sort()).toEqual(expectedKeys.sort())
	})

	describe('Address pattern', () => {
		const regex = SensitivePatterns.Address

		it('should match valid addresses', () => {
			const validAddresses = [
				'123 Main Street',
				'456 Elm St',
				'789 Oak Avenue',
				'101 Pine Blvd',
				'202 Maple Road',
				'303 Birch Rd',
				'404 Cedar Lane',
				'505 Spruce Ln',
				'606 Walnut Drive',
				'707 Cherry Dr',
			]

			validAddresses.forEach((address) => {
				expect(address).toMatch(regex)
			})
		})

		it('should not match invalid addresses', () => {
			const invalidAddresses = ['Main Street', '1234', 'Street 123', '123 Main', '123 Main Blvd Avenue']

			invalidAddresses.forEach((address) => {
				expect(address).not.toMatch(regex)
			})
		})
	})

	describe('BankAccountNumber pattern', () => {
		const regex = SensitivePatterns.BankAccountNumber

		it('should match valid bank account numbers', () => {
			const validNumbers = ['123456789', '987654321012', '123456789012345678']

			validNumbers.forEach((number) => {
				expect(number).toMatch(regex)
			})
		})

		it('should not match invalid bank account numbers', () => {
			const invalidNumbers = ['12345678', '1234567890123456789', '12345abc789', '123-456-789']

			invalidNumbers.forEach((number) => {
				expect(number).not.toMatch(regex)
			})
		})
	})

	describe('BankRoutingNumber pattern', () => {
		const regex = SensitivePatterns.BankRoutingNumber

		it('should match valid bank routing numbers', () => {
			const validNumbers = ['123456789', '987654321']

			validNumbers.forEach((number) => {
				expect(number).toMatch(regex)
			})
		})

		it('should not match invalid bank routing numbers', () => {
			const invalidNumbers = ['12345678', '1234567890', '12345abc9', '123-456-789']

			invalidNumbers.forEach((number) => {
				expect(number).not.toMatch(regex)
			})
		})
	})

	describe('BiometricData pattern', () => {
		const regex = SensitivePatterns.BiometricData

		it('should match valid biometric data', () => {
			const validData = ['BiometricID: ABCD1234', 'BiometricID: 12345678', 'BiometricID: A1B2C3D4']

			validData.forEach((data) => {
				expect(data).toMatch(regex)
			})
		})

		it('should not match invalid biometric data', () => {
			const invalidData = [
				'BiometricID: ABC123',
				'BiometricID: ABCDEFGH9',
				'Biometric ID: ABCD1234',
				'BioMetricID: ABCD1234',
			]

			invalidData.forEach((data) => {
				expect(data).not.toMatch(regex)
			})
		})
	})

	describe('CitizenId pattern', () => {
		const regex = SensitivePatterns.CitizenId

		it('should match valid Citizen IDs', () => {
			const validIds = ['CID 1234567890', 'CID1234567890']

			validIds.forEach((id) => {
				expect(id).toMatch(regex)
			})
		})

		it('should not match invalid Citizen IDs', () => {
			const invalidIds = ['CID 123456789', 'CID12345678901', 'CID ABCDEFGHIJ', 'CITIZENID1234567890']

			invalidIds.forEach((id) => {
				expect(id).not.toMatch(regex)
			})
		})
	})

	describe('CreditCard pattern', () => {
		const regex = SensitivePatterns.CreditCard

		it('should match valid credit card numbers', () => {
			const validCards = [
				'5500-0000-0000-0004', // Mastercard
				'3400 0000 0000 009', // AMEX-like (4-4-4-3)
				'3000 0000 0000 04', // Diners Club-like (4-4-4-2)
				'6011-0000-0000-0004', // Discover
				'2014 0000 0000 009', // Diners Club-like (4-4-4-3)
				'3088 0000 0000 0009', // Diners Club-like (4-4-4-3)
				'1234567890123', // Diners Club-like (13 digits)
				'1234567890123456', // Non-standard (16 digits)
			]

			validCards.forEach((card) => {
				expect(card).toMatch(regex)
			})
		})

		it('should not match invalid credit card numbers', () => {
			const invalidCards = ['4111 1111 1111', '5500-0000-0000-00044', '3400 0000 0000 00A', 'abcd efgh ijkl mnop']

			invalidCards.forEach((card) => {
				expect(card).not.toMatch(regex)
			})
		})
	})

	describe('CreditScore pattern', () => {
		const regex = SensitivePatterns.CreditScore

		it('should match valid credit scores', () => {
			const validScores = ['300', '450', '600', '750', '900', '1000']

			validScores.forEach((score) => {
				expect(score).toMatch(regex)
			})
		})

		it('should not match invalid credit scores', () => {
			const invalidScores = ['299', '1001', 'abc', '700a', '75']

			invalidScores.forEach((score) => {
				expect(score).not.toMatch(regex)
			})
		})
	})

	describe('Dob pattern', () => {
		const regex = SensitivePatterns.Dob

		it('should match valid dates of birth', () => {
			const validDobs = ['01/01/1990', '12-31-2000', '07.04.1976', '09/15/1985', '10-10-2010']

			validDobs.forEach((dob) => {
				expect(dob).toMatch(regex)
			})
		})

		it('should not match invalid dates of birth', () => {
			const invalidDobs = [
				'1/1/1990',
				'13/01/1990',
				'00-31-2000',
				'07.32.1976',
				'07.04.76',
				'July 4, 1976',
				'07/04/1976a',
			]

			invalidDobs.forEach((dob) => {
				expect(dob).not.toMatch(regex)
			})
		})
	})

	describe('DriversLicense pattern', () => {
		const regex = SensitivePatterns.DriversLicense

		it("should match valid driver's licenses", () => {
			const validLicenses = ['A1234567', 'B7654321', 'C0000000']

			validLicenses.forEach((license) => {
				expect(license).toMatch(regex)
			})
		})

		it("should not match invalid driver's licenses", () => {
			const invalidLicenses = ['AA1234567', '12345678', 'A123456', 'A12345678', 'a1234567', 'A12345B7']

			invalidLicenses.forEach((license) => {
				expect(license).not.toMatch(regex)
			})
		})
	})

	describe('Email pattern', () => {
		const regex = SensitivePatterns.Email

		it('should match valid email addresses', () => {
			const validEmails = [
				'user@example.com',
				'user.name+tag+sorting@example.com',
				'user_name@example.co.uk',
				'user-name@sub.example.com',
				'user123@example.io',
				'test+sub@gmail.com',
			]

			validEmails.forEach((email) => {
				expect(email).toMatch(regex)
			})
		})

		it('should not match invalid email addresses', () => {
			const invalidEmails = [
				'plainaddress',
				'@no-local-part.com',
				'Outlook Contact <outlook-contact@domain.com>',
				'no-at.domain.com',
				'user@.com.my',
				'user@domain..com',
				'user@domain.c',
				'user@domain,com',
				'user@domain@domain.com',
			]

			invalidEmails.forEach((email) => {
				expect(email).not.toMatch(regex)
			})
		})
	})

	describe('EmployeeId pattern', () => {
		const regex = SensitivePatterns.EmployeeId

		it('should match valid employee IDs', () => {
			const validIds = ['EID123456', 'EID654321', 'EID000001']

			validIds.forEach((id) => {
				expect(id).toMatch(regex)
			})
		})

		it('should not match invalid employee IDs', () => {
			const invalidIds = ['EID12345', 'EID1234567', 'EID12A456', 'EMP123456', 'EID123-456']

			invalidIds.forEach((id) => {
				expect(id).not.toMatch(regex)
			})
		})
	})

	describe('GovernmentId pattern', () => {
		const regex = SensitivePatterns.GovernmentId

		it('should match valid government IDs', () => {
			const validIds = ['GID12345678', 'GID87654321', 'GID00000000']

			validIds.forEach((id) => {
				expect(id).toMatch(regex)
			})
		})

		it('should not match invalid government IDs', () => {
			const invalidIds = ['GID1234567', 'GID123456789', 'GID12345A7', 'GOVID12345678', 'GID123-45678']

			invalidIds.forEach((id) => {
				expect(id).not.toMatch(regex)
			})
		})
	})

	describe('HealthInsuranceNumber pattern', () => {
		const regex = SensitivePatterns.HealthInsuranceNumber

		it('should match valid health insurance numbers', () => {
			const validNumbers = ['HIN1234567890', 'HIN0987654321', 'HIN0000000000']

			validNumbers.forEach((number) => {
				expect(number).toMatch(regex)
			})
		})

		it('should not match invalid health insurance numbers', () => {
			const invalidNumbers = [
				'HIN123456789',
				'HIN12345678901',
				'HIN12345A7890',
				'HEALTH12345678',
				'HIN123-4567890',
			]

			invalidNumbers.forEach((number) => {
				expect(number).not.toMatch(regex)
			})
		})
	})

	describe('InsurancePolicyNumber pattern', () => {
		const regex = SensitivePatterns.InsurancePolicyNumber

		it('should match valid insurance policy numbers', () => {
			const validNumbers = ['IPN123456789012', 'IPN098765432109', 'IPN000000000000']

			validNumbers.forEach((number) => {
				expect(number).toMatch(regex)
			})
		})

		it('should not match invalid insurance policy numbers', () => {
			const invalidNumbers = [
				'IPN1234567890',
				'IPN1234567890123',
				'IPN12345A789012',
				'INSURANCE123456',
				'IPN123-456789012',
			]

			invalidNumbers.forEach((number) => {
				expect(number).not.toMatch(regex)
			})
		})
	})

	describe('IpAddress pattern', () => {
		const regex = SensitivePatterns.IpAddress

		it('should match valid IP addresses', () => {
			const validIps = ['192.168.1.1', '10.0.0.255', '172.16.0.0', '8.8.8.8', '255.255.255.255']

			validIps.forEach((ip) => {
				expect(ip).toMatch(regex)
			})
		})

		it('should not match invalid IP addresses', () => {
			const invalidIps = [
				'256.256.256.256',
				'192.168.1',
				'192.168.1.1.1',
				'192.168.1.a',
				'192.168.01.1',
				'192.168.1.-1',
			]

			invalidIps.forEach((ip) => {
				expect(ip).not.toMatch(regex)
			})
		})
	})

	describe('LinkedInId pattern', () => {
		const regex = SensitivePatterns.LinkedInId

		it('should match valid LinkedIn IDs', () => {
			const validIds = ['LIIDABCDEFG123', 'LIID1234567890', 'LIIDA1B2C3D4E5']

			validIds.forEach((id) => {
				expect(id).toMatch(regex)
			})
		})

		it('should not match invalid LinkedIn IDs', () => {
			const invalidIds = [
				'LIIDABC',
				'LIID123456789012345',
				'LIID12345A678',
				'LINKID1234567890',
				'LIID123-4567890',
			]

			invalidIds.forEach((id) => {
				expect(id).not.toMatch(regex)
			})
		})
	})

	describe('MedicalLicense pattern', () => {
		const regex = SensitivePatterns.MedicalLicense

		it('should match valid medical licenses', () => {
			const validLicenses = ['ML12345', 'ML678901', 'ML00000']

			validLicenses.forEach((license) => {
				expect(license).toMatch(regex)
			})
		})

		it('should not match invalid medical licenses', () => {
			const invalidLicenses = ['ML1234', 'ML1234567', 'ML12A45', 'MEDLICENSE12345', 'ML123-456']

			invalidLicenses.forEach((license) => {
				expect(license).not.toMatch(regex)
			})
		})
	})

	describe('MedicalRecordNumber pattern', () => {
		const regex = SensitivePatterns.MedicalRecordNumber

		it('should match valid medical record numbers', () => {
			const validNumbers = ['MRN123456', 'MRN654321', 'MRN000001']

			validNumbers.forEach((number) => {
				expect(number).toMatch(regex)
			})
		})

		it('should not match invalid medical record numbers', () => {
			const invalidNumbers = ['MRN12345', 'MRN1234567', 'MRN12A456', 'MEDREC123456', 'MRN123-456']

			invalidNumbers.forEach((number) => {
				expect(number).not.toMatch(regex)
			})
		})
	})

	describe('NationalId pattern', () => {
		const regex = SensitivePatterns.NationalId

		it('should match valid national IDs', () => {
			const validIds = ['NID1234567890', 'NID0987654321', 'NID0000000000']

			validIds.forEach((id) => {
				expect(id).toMatch(regex)
			})
		})

		it('should not match invalid national IDs', () => {
			const invalidIds = ['NID123456789', 'NID12345678901', 'NID12345A7890', 'NATIONAL12345678', 'NID123-4567890']

			invalidIds.forEach((id) => {
				expect(id).not.toMatch(regex)
			})
		})
	})

	describe('Password pattern', () => {
		const regex = SensitivePatterns.Password

		it('should match valid password entries', () => {
			const validPasswords = ['password: myP@ssw0rd', 'password: 12345678', 'password: abcdefgh']

			validPasswords.forEach((entry) => {
				expect(entry).toMatch(regex)
			})
		})

		it('should not match invalid password entries', () => {
			const invalidPasswords = [
				'pass: myP@ssw0rd',
				'password myP@ssw0rd',
				'password: ',
				'password:12345678',
				'PASSWORD: myP@ssw0rd',
			]

			invalidPasswords.forEach((entry) => {
				expect(entry).not.toMatch(regex)
			})
		})
	})

	describe('PersonalIdentificationNumber pattern', () => {
		const regex = SensitivePatterns.PersonalIdentificationNumber

		it('should match valid personal identification numbers', () => {
			const validPins = ['PIN1234', 'PIN567890']

			validPins.forEach((pin) => {
				expect(pin).toMatch(regex)
			})
		})

		it('should not match invalid personal identification numbers', () => {
			const invalidPins = ['PIN123', 'PIN1234567', 'PIN12A4', 'PERSONALPIN1234', 'PIN123-456']

			invalidPins.forEach((pin) => {
				expect(pin).not.toMatch(regex)
			})
		})
	})

	describe('PersonalTaxCode pattern', () => {
		const regex = SensitivePatterns.PersonalTaxCode

		it('should match valid personal tax codes', () => {
			const validCodes = ['PTC12345678901', 'PTC09876543210', 'PTC00000000000']

			validCodes.forEach((code) => {
				expect(code).toMatch(regex)
			})
		})

		it('should not match invalid personal tax codes', () => {
			const invalidCodes = [
				'PTC1234567890',
				'PTC1234567890123',
				'PTC12345A789012',
				'PERSONTAX1234567',
				'PTC123-45678901',
			]

			invalidCodes.forEach((code) => {
				expect(code).not.toMatch(regex)
			})
		})
	})

	describe('PhoneNumber pattern', () => {
		const regex = SensitivePatterns.PhoneNumber

		it('should match valid phone numbers', () => {
			const validNumbers = ['123-456-7890', '123.456.7890', '1234567890', '123-4567890', '123456-7890']

			validNumbers.forEach((number) => {
				expect(number).toMatch(regex)
			})
		})

		it('should not match invalid phone numbers', () => {
			const invalidNumbers = ['12-3456-7890', '123-45-67890', '123456789', '123-4567-890', 'phone1234567']

			invalidNumbers.forEach((number) => {
				expect(number).not.toMatch(regex)
			})
		})
	})

	describe('SsinitNumber pattern', () => {
		const regex = SensitivePatterns.SsinitNumber

		it('should match valid SSNIT numbers', () => {
			const validNumbers = ['SSNIT12345678901', 'SSNIT09876543210', 'SSNIT00000000000']

			validNumbers.forEach((number) => {
				expect(number).toMatch(regex)
			})
		})

		it('should not match invalid SSNIT numbers', () => {
			const invalidNumbers = [
				'SSNIT1234567890',
				'SSNIT123456789012',
				'SSNIT12345A78901',
				'SSINIT1234567890',
				'SSNIT123-45678901',
			]

			invalidNumbers.forEach((number) => {
				expect(number).not.toMatch(regex)
			})
		})
	})

	describe('Ssn pattern', () => {
		const regex = SensitivePatterns.Ssn

		it('should match valid SSNs', () => {
			const validSsns = ['123-45-6789', '987-65-4321', '000-00-0000']

			validSsns.forEach((ssn) => {
				expect(ssn).toMatch(regex)
			})
		})

		it('should not match invalid SSNs', () => {
			const invalidSsns = ['123-456-789', '123-45-67890', '123456789', '12-345-6789', '123-45-678a']

			invalidSsns.forEach((ssn) => {
				expect(ssn).not.toMatch(regex)
			})
		})
	})

	describe('StudentId pattern', () => {
		const regex = SensitivePatterns.StudentId

		it('should match valid student IDs', () => {
			const validIds = ['SID12345678', 'SID87654321', 'SID00000000']

			validIds.forEach((id) => {
				expect(id).toMatch(regex)
			})
		})

		it('should not match invalid student IDs', () => {
			const invalidIds = ['SID1234567', 'SID123456789', 'SID12A4567', 'STUDENT123456', 'SID123-4567']

			invalidIds.forEach((id) => {
				expect(id).not.toMatch(regex)
			})
		})
	})

	describe('TaxIdentificationNumber pattern', () => {
		const regex = SensitivePatterns.TaxIdentificationNumber

		it('should match valid tax identification numbers', () => {
			const validNumbers = ['TIN123456789', 'TIN098765432', 'TIN000000000']

			validNumbers.forEach((number) => {
				expect(number).toMatch(regex)
			})
		})

		it('should not match invalid tax identification numbers', () => {
			const invalidNumbers = ['TIN12345678', 'TIN1234567890', 'TIN12345A789', 'TAX123456789', 'TIN123-456789']

			invalidNumbers.forEach((number) => {
				expect(number).not.toMatch(regex)
			})
		})
	})

	describe('TelecomCustomerId pattern', () => {
		const regex = SensitivePatterns.TelecomCustomerId

		it('should match valid telecom customer IDs', () => {
			const validIds = ['TCID1234567890', 'TCID0987654321', 'TCID0000000000']

			validIds.forEach((id) => {
				expect(id).toMatch(regex)
			})
		})

		it('should not match invalid telecom customer IDs', () => {
			const invalidIds = [
				'TCID123456789',
				'TCID12345678901',
				'TCID12345A7890',
				'TELCID1234567890',
				'TCID123-4567890',
			]

			invalidIds.forEach((id) => {
				expect(id).not.toMatch(regex)
			})
		})
	})
})
