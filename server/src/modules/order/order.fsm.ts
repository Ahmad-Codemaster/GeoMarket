import { OrderStatus } from '@geomarket/shared';

/**
 * Explicit Valid Order State Transitions
 */
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Checks if a transition from currentStatus to targetStatus is valid.
 */
export function isValidOrderTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
): boolean {
  const allowed = VALID_ORDER_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

/**
 * Cancellation is strictly permitted only from PLACED and CONFIRMED.
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === OrderStatus.PLACED || status === OrderStatus.CONFIRMED;
}
