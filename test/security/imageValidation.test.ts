import { describe, it, expect } from 'vitest'
import { matchesMagicBytes } from '~~/server/utils/imageValidation'

describe('Image magic-byte validation', () => {
  it('accepts a real JPEG signature regardless of declared spoofing attempts on other types', () => {
    const jpeg = Buffer.concat([
      Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
      Buffer.alloc(16, 0x00)
    ])
    expect(matchesMagicBytes(jpeg, 'image/jpeg')).toBe(true)
    expect(matchesMagicBytes(jpeg, 'image/png')).toBe(false)
    expect(matchesMagicBytes(jpeg, 'image/webp')).toBe(false)
  })

  it('accepts a real PNG signature', () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
      Buffer.alloc(8, 0x00)
    ])
    expect(matchesMagicBytes(png, 'image/png')).toBe(true)
    expect(matchesMagicBytes(png, 'image/jpeg')).toBe(false)
  })

  it('accepts a real WebP (RIFF/WEBP) signature', () => {
    const webp = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0x24, 0x08, 0x00, 0x00]),
      Buffer.from('WEBPVP8 ')
    ])
    expect(matchesMagicBytes(webp, 'image/webp')).toBe(true)
  })

  it('accepts HEIC/HEIF ISO-BMFF containers with known brands', () => {
    const heic = Buffer.concat([
      Buffer.alloc(4, 0x00),
      Buffer.from('ftyp'),
      Buffer.from('heic'),
      Buffer.alloc(8, 0x00)
    ])
    const heif = Buffer.concat([
      Buffer.alloc(4, 0x00),
      Buffer.from('ftyp'),
      Buffer.from('mif1'),
      Buffer.alloc(8, 0x00)
    ])
    expect(matchesMagicBytes(heic, 'image/heic')).toBe(true)
    expect(matchesMagicBytes(heif, 'image/heif')).toBe(true)

    const unknownBrand = Buffer.concat([
      Buffer.alloc(4, 0x00),
      Buffer.from('ftyp'),
      Buffer.from('isom'),
      Buffer.alloc(8, 0x00)
    ])
    expect(matchesMagicBytes(unknownBrand, 'image/heic')).toBe(false)
  })

  it('rejects non-image payloads masquerading as images (e.g. HTML/PHP/script)', () => {
    const html = Buffer.concat([Buffer.from('<!DOCTYPE html><html>'), Buffer.alloc(8, 0x41)])
    const php = Buffer.concat([Buffer.from('<?php echo "pwn"; ?>'), Buffer.alloc(8, 0x00)])
    const elf = Buffer.concat([Buffer.from([0x7F, 0x45, 0x4C, 0x46]), Buffer.alloc(12, 0x00)])

    for (const mime of ['image/jpeg', 'image/png', 'image/webp', 'image/heic']) {
      expect(matchesMagicBytes(html, mime)).toBe(false)
      expect(matchesMagicBytes(php, mime)).toBe(false)
      expect(matchesMagicBytes(elf, mime)).toBe(false)
    }
  })

  it('rejects buffers that are too short to contain any known signature', () => {
    const tiny = Buffer.from([0xFF, 0xD8])
    expect(matchesMagicBytes(tiny, 'image/jpeg')).toBe(false)
    expect(matchesMagicBytes(Buffer.alloc(0), 'image/png')).toBe(false)
  })
})
