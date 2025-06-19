export default function formatFloat(value: number | string, precision: number = 2, toNumber: boolean = false) {
  if (typeof value === 'string') {
    value = parseFloat(value)
  }
  let fixedValue = value.toFixed(precision)
  if (toNumber) {
    return parseFloat(fixedValue)
  }
  return fixedValue
}