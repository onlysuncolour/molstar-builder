export default function getFilenameFromUrl(url: string) {
  const filename = url.split("/")[-1].split("?")[0].split("#")[0]
  if (!filename || !filename.includes(".")) {
    return undefined
  }
  return filename
}