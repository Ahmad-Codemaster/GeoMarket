import { PrismaClient, Prisma } from '@prisma/client';
import { slugify } from '../store/store.slug';

export { slugify };

export async function generateUniqueProductSlug(
  prismaClient: PrismaClient | Prisma.TransactionClient,
  storeId: string,
  name: string,
  existingProductId?: string,
): Promise<string> {
  const baseSlug = slugify(name) || 'product';
  let candidateSlug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prismaClient.product.findFirst({
      where: {
        storeId,
        slug: candidateSlug,
        ...(existingProductId ? { NOT: { id: existingProductId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }
}
