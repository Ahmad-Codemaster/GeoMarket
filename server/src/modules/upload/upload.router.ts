import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response) => {
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

    const rawExt = mimeType.split('/')[1] || 'jpg';
    const ext = rawExt.toLowerCase() === 'jpeg' ? 'jpg' : rawExt.toLowerCase();
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image file size cannot exceed 5MB' });
    }

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
