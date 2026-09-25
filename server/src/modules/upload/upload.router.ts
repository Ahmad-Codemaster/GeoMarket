import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { UserRole } from '@geomarket/shared';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = Router();

export function validateImageMagicBytes(buffer: Buffer): { valid: boolean; detectedType?: string } {
  if (buffer.length < 12) {
    return { valid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, detectedType: 'image/png' };
  }

  // GIF: 47 49 46 38 ("GIF8")
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { valid: true, detectedType: 'image/gif' };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50  // WEBP
  ) {
    return { valid: true, detectedType: 'image/webp' };
  }

  return { valid: false };
}

router.post('/', requireAuth, requireRole(UserRole.VENDOR, UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { image, filename } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required (base64 data URI or string)' });
    }

    // Match data URI regex (e.g. data:image/png;base64,...) or raw base64
    const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid file format. Allowed formats: JPG, PNG, WEBP, GIF' });
    }

    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image file size cannot exceed 5MB' });
    }

    // Magic-byte signature verification to prevent spoofed uploads
    const magicByteCheck = validateImageMagicBytes(buffer);
    if (!magicByteCheck.valid || !magicByteCheck.detectedType) {
      return res.status(400).json({ error: 'Invalid file content: Not a valid image file.' });
    }

    const detectedExtMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const ext = detectedExtMap[magicByteCheck.detectedType] || 'jpg';

    // Resolve upload directory: server/public/uploads
    const uploadsDir = path.resolve(__dirname, '../../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanBase = (filename || 'product')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 25);
    const uniqueFilename = `${cleanBase}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
    const targetFilePath = path.join(uploadsDir, uniqueFilename);

    await fs.promises.writeFile(targetFilePath, buffer);

    return res.status(200).json({
      url: `/uploads/${uniqueFilename}`,
      filename: uniqueFilename,
    });
  } catch (error: any) {
    console.error('[Upload Error]', error);
    return res.status(500).json({ error: 'Failed to upload product image' });
  }
});

export default router;
