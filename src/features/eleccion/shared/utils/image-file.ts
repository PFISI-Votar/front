const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png'])
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

export const IMAGE_FILE_REQUIREMENTS =
  'Usá una imagen PNG o JPG/JPEG de hasta 2MB.'

export const validateElectoralImageFile = (file: File): string | null => {
  const lowerName = file.name.toLowerCase()
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((extension) =>
    lowerName.endsWith(extension)
  )

  if (!ALLOWED_MIME_TYPES.has(file.type) || !hasAllowedExtension) {
    return 'El archivo debe estar en formato PNG o JPG/JPEG.'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'La imagen no puede superar los 2MB.'
  }

  return null
}
