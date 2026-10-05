const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png'])
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_MAGIC = [0xff, 0xd8, 0xff]

export const IMAGE_FILE_REQUIREMENTS =
  'Usá una imagen PNG o JPG/JPEG de hasta 2MB.'

export const PREVIOUS_ELECTORAL_IMAGE_NOTE =
  'Se descarta este archivo y se mantiene la imagen anterior.'

export const withPreviousElectoralImageKept = (
  message: string,
  keepsPrevious: boolean
) => (keepsPrevious ? `${message} ${PREVIOUS_ELECTORAL_IMAGE_NOTE}` : message)

export const formatRejectedImageError = withPreviousElectoralImageKept

export const isElectoralImageRejectionMessage = (message: string) =>
  /imagen|PNG|JPG|JPEG|contenido del archivo|formato real|tamaño máximo/i.test(
    message
  )

const extensionOf = (name: string): string => {
  const basename = name.split('\0')[0]?.replace(/.*[/\\]/, '') ?? ''
  const lower = basename.toLowerCase()
  const index = lower.lastIndexOf('.')
  return index === -1 ? '' : lower.slice(index)
}

const expectedMime = (extension: string): 'image/png' | 'image/jpeg' | null => {
  if (extension === '.png') return 'image/png'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  return null
}

const matchesMagic = (bytes: Uint8Array, magic: number[]) =>
  bytes.length >= magic.length &&
  magic.every((byte, index) => bytes[index] === byte)

const detectMimeFromMagicBytes = async (
  file: File
): Promise<'image/png' | 'image/jpeg' | null> => {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  if (matchesMagic(header, PNG_MAGIC)) return 'image/png'
  if (matchesMagic(header, JPEG_MAGIC)) return 'image/jpeg'
  return null
}

export const validateElectoralImageFile = async (
  file: File
): Promise<string | null> => {
  const extension = extensionOf(file.name)
  const declaredMatchesExtension =
    ALLOWED_MIME_TYPES.has(file.type) && ALLOWED_EXTENSIONS.includes(extension)

  if (!declaredMatchesExtension || expectedMime(extension) !== file.type) {
    return 'El archivo debe estar en formato PNG o JPG/JPEG.'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'La imagen no puede superar los 2MB.'
  }

  const detected = await detectMimeFromMagicBytes(file)
  if (!detected) {
    return 'El contenido del archivo no corresponde a una imagen PNG o JPG/JPEG válida.'
  }
  if (detected !== expectedMime(extension) || detected !== file.type) {
    return 'La extensión o el tipo declarado no coincide con el formato real de la imagen.'
  }

  return null
}
