export default function getFileType(name: string | null | undefined) {
  try {
    return name?.split('.').pop() || ''
  } catch (error) {
    return ''
  }
}