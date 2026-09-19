import { PrismaClient, Prisma } from '@prisma/client';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-')  // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

export async function generateUniqueStoreSlug(
  prismaClient: PrismaClient | Prisma.TransactionClient,
  name: string,
  existingStoreId?: string,
): Promise<string> {
  const baseSlug = slugify(name) || 'store';
  let candidateSlug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prismaClient.store.findFirst({
      where: {
        slug: candidateSlug,
        ...(existingStoreId ? { NOT: { id: existingStoreId } } : {}),
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
