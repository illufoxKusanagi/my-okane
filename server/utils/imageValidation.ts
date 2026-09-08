/**
 * Checks the leading bytes of a buffer against known image file signatures.
 * HEIC/HEIF are ISO-BMFF containers: "ftyp" at offset 4 followed by a brand.
 */
export function matchesMagicBytes(buf: Buffer, mimeType: string): boolean {
  if (buf.length < 12) return false

  switch (mimeType) {
    case 'image/jpeg':
      return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF
    case 'image/png':
      return (
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47
      )
    case 'image/webp':
      return (
        buf.subarray(0, 4).toString('ascii') === 'RIFF'
        && buf.subarray(8, 12).toString('ascii') === 'WEBP'
      )
    case 'image/heic':
    case 'image/heif': {
      const brand = buf.subarray(8, 12).toString('ascii').toLowerCase()
      return (
        buf.subarray(4, 8).toString('ascii') === 'ftyp'
        && ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'].includes(brand)
      )
    }
    default:
      return false
  }
}
