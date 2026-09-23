import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { UserRole } from '@geomarket/shared';
import bcrypt from 'bcrypt';

/**
 * GET /api/v1/admin/stats
 * Returns platform-level KPIs for the admin dashboard.
 */
export async function getPlatformStats(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      totalUsers,
      totalVendors,
      totalCustomers,
      totalStores,
      activeStores,
      revenueAll,
      revenueToday,
      revenueWeek,
      revenueMonth,
      recentOrders,
      topStores,
    ] = await Promise.all([
      // Orders counts
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),

      // User counts
      prisma.user.count({ where: { isGuest: false } }),
      prisma.user.count({ where: { role: UserRole.VENDOR, isGuest: false } }),
      prisma.user.count({ where: { role: UserRole.CUSTOMER, isGuest: false } }),

      // Stores
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),

      // Revenue aggregates (sum of totalAmount from non-cancelled orders)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['DELIVERED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] as any } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] as any },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] as any },
          createdAt: { gte: weekStart },
        },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] as any },
          createdAt: { gte: monthStart },
        },
      }),

      // Recent orders (last 10)
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          store: { select: { name: true } },
        },
      }),

      // Top stores by order count
      prisma.order.groupBy({
        by: ['storeId'],
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Fetch store names for top stores
    const storeIds = topStores.map((s) => s.storeId);
    const storeDetails = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, slug: true },
    });
    const storeMap = Object.fromEntries(storeDetails.map((s) => [s.id, s]));

    return res.json({
      stats: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
        },
        users: {
          total: totalUsers,
          customers: totalCustomers,
          vendors: totalVendors,
        },
        stores: {
          total: totalStores,
          active: activeStores,
        },
        revenue: {
          total: Number(revenueAll._sum?.totalAmount ?? 0),
          today: Number(revenueToday._sum?.totalAmount ?? 0),
          week: Number(revenueWeek._sum?.totalAmount ?? 0),
          month: Number(revenueMonth._sum?.totalAmount ?? 0),
        },
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
        customerName: o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Guest',
        customerEmail: o.user?.email ?? '',
        storeName: o.store?.name ?? '',
      })),
      topStores: topStores.map((s) => ({
        storeId: s.storeId,
        storeName: storeMap[s.storeId]?.name ?? s.storeId,
        orderCount: s._count.id,
        revenue: Number(s._sum.totalAmount ?? 0),
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/admin/users
 * Returns paginated list of all users with role filter support.
 */
export async function getAdminUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt((req.query.pageSize as string) || '20', 10)));
    const role = req.query.role as UserRole | undefined;
    const search = (req.query.search as string) || '';

    const where: any = { isGuest: false };
    if (role && Object.values(UserRole).includes(role)) {
      where.role = role;
    }
    if (search.trim()) {
      where.OR = [
        { firstName: { contains: search.trim(), mode: 'insensitive' } },
        { lastName: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          vendorProfile: {
            select: {
              id: true,
              businessLegalName: true,
              stores: {
                select: { id: true, name: true, slug: true, isActive: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Change a user's role.
 */
export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent self-demotion
    if (req.user!.id === userId) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/admin/users/:userId
 * Soft-delete / deactivate a user account.
 */
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    if (req.user!.id === userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id: userId } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/admin/change-password
 * Admin changes their own password.
 */
export async function changeAdminPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Invalid input. New password must be at least 8 characters.' });
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || !admin.passwordHash) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: adminId },
      data: { passwordHash: newHash },
    });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}
