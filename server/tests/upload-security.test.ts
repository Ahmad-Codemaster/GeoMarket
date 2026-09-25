import { describe, it, expect } from 'vitest';
import { validateImageMagicBytes } from '../src/modules/upload/upload.router';

describe('Upload Security - Magic Byte Validation', () => {
  it('should accept genuine JPEG magic bytes', () => {
    // FF D8 FF E0 ...
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const result = validateImageMagicBytes(jpegBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/jpeg');
  });

  it('should accept genuine PNG magic bytes', () => {
    // 89 50 4E 47 0D 0A 1A 0A ...
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const result = validateImageMagicBytes(pngBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/png');
  });

  it('should accept genuine GIF magic bytes', () => {
    // GIF89a
    const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]);
    const result = validateImageMagicBytes(gifBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/gif');
  });

  it('should accept genuine WebP magic bytes', () => {
    // RIFF....WEBP
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // length
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    const result = validateImageMagicBytes(webpBuffer);
    expect(result.valid).toBe(true);
    expect(result.detectedType).toBe('image/webp');
  });

  it('should reject text or executable pretending to be an image', () => {
    const fakeImageBuffer = Buffer.from('<?php echo "evil payload"; ?>');
    const result = validateImageMagicBytes(fakeImageBuffer);
    expect(result.valid).toBe(false);
  });

  it('should reject short or empty buffers', () => {
    const emptyBuffer = Buffer.from([]);
    const shortBuffer = Buffer.from([0xff, 0xd8]);
    expect(validateImageMagicBytes(emptyBuffer).valid).toBe(false);
    expect(validateImageMagicBytes(shortBuffer).valid).toBe(false);
  });
});
