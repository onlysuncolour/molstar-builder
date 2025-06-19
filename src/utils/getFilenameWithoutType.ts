export default function getFilenameWithoutType(filename: string) {
  const result = filename.split('.')
  if (result.length > 1) {
    result.pop()
  }
  return result.join('.')
}
