export default function getFileBasicType(filename: string) {
  return filename.split('.').pop()
}