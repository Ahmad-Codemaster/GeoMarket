import { Request, Response, NextFunction } from 'express';
import { createAddressSchema, updateAddressSchema } from './address.schemas';
import * as addressService from './address.service';

export async function createAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsed = createAddressSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const address = await addressService.createAddress(userId, parsed.data);
    return res.status(201).json({ address });
  } catch (err) {
    next(err);
  }
}

export async function getAddresses(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const addresses = await addressService.getAddresses(userId);
    return res.status(200).json({ addresses });
  } catch (err) {
    next(err);
  }
}

export async function getAddressById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const address = await addressService.getAddressById(id, userId);
    return res.status(200).json({ address });
  } catch (err) {
    if (err instanceof Error && err.message === 'ADDRESS_NOT_FOUND') {
      return res.status(404).json({ error: 'Address not found' });
    }
    next(err);
  }
}

export async function updateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const parsed = updateAddressSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    const address = await addressService.updateAddress(id, userId, parsed.data);
    return res.status(200).json({ address });
  } catch (err) {
    if (err instanceof Error && err.message === 'ADDRESS_NOT_FOUND') {
      return res.status(404).json({ error: 'Address not found' });
    }
    next(err);
  }
}

export async function setDefaultAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const address = await addressService.setDefaultAddress(id, userId);
    return res.status(200).json({ address });
  } catch (err) {
    if (err instanceof Error && err.message === 'ADDRESS_NOT_FOUND') {
      return res.status(404).json({ error: 'Address not found' });
    }
    next(err);
  }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await addressService.deleteAddress(id, userId);
    return res.status(200).json({ message: 'Address deleted successfully' });
  } catch (err) {
    if (err instanceof Error && err.message === 'ADDRESS_NOT_FOUND') {
      return res.status(404).json({ error: 'Address not found' });
    }
    next(err);
  }
}
