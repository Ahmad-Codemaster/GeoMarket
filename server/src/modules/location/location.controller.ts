import { Request, Response, NextFunction } from 'express';
import { reverseGeocodeSchema, forwardGeocodeSchema } from './location.schemas';
import * as locationService from './location.service';
import { GeocodingException } from './location.types';

export async function handleReverseGeocode(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = reverseGeocodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const result = await locationService.reverseGeocode(parsed.data);
    return res.status(200).json({ location: result });
  } catch (err) {
    if (err instanceof GeocodingException) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    next(err);
  }
}

export async function handleForwardGeocode(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = forwardGeocodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const results = await locationService.forwardGeocode(parsed.data);
    return res.status(200).json({ locations: results });
  } catch (err) {
    if (err instanceof GeocodingException) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    next(err);
  }
}
