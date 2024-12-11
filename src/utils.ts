export function isFalsy(text: string, additionalFalsyValues: string[] = []): boolean {
	const defaultFalsyValues = ['', '0', 'false', 'no', 'nil', 'none', 'n/a', 'undefined', 'null', 'off']
	const falsyValues = [...defaultFalsyValues, ...additionalFalsyValues.map((v) => v.toLowerCase())]

	return falsyValues.includes(String(text).trim().toLowerCase())
}
