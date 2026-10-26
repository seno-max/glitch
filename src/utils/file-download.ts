import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

/**
 * Saves a binary blob for the user. On web this triggers a normal browser
 * download; inside the Android WebView, blob-URL downloads don't work, so
 * the file is written to the app's Documents directory via the Capacitor
 * Filesystem plugin instead (no runtime permission needed for app-scoped
 * dirs) and the resolved path is returned.
 */
export async function saveOrDownloadFile(fileName: string, mimeType: string, data: Blob): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([data], { type: mimeType }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return fileName
  }

  const base64 = await blobToBase64(data)
  const dir = Directory.Documents
  const result = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: dir,
    recursive: true,
  })
  return result.uri
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Strip the "data:...;base64," prefix — Filesystem.writeFile expects raw base64.
      const commaIdx = result.indexOf(',')
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result)
    }
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}
