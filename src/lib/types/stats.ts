// Статистика магазина для дашборда админки: GET /admin/stats?from&to

import type { OrderStatus } from './order';

/** Период в часовом поясе магазина, даты YYYY-MM-DD включительно */
export interface StatsRange {
	from: string;
	to: string;
	days: number;
	timezone: string;
}

/** Заказы периода по дате создания, кроме отменённых */
export interface SalesStats {
	revenue: string;
	orders: number;
	averageOrder: string;
	deliveryOrders: number;
	pickupOrders: number;
	discountTotal: string;
	couponOrders: number;
	/** То же за период той же длины перед `from` */
	previous: { revenue: string; orders: number; averageOrder: string };
}

/** Один день периода; дни без заказов тоже приходят, с нулями */
export interface DailyPoint {
	date: string;
	revenue: string;
	orders: number;
	cancelled: number;
}

export interface RecentCancellation {
	orderId: number;
	cancelledAt: string;
	by: 'customer' | 'staff';
	/** null у старых заказов без записи в истории статусов */
	fromStatus: OrderStatus | null;
	comment: string | null;
}

/** Отменённые среди заказов периода */
export interface CancellationStats {
	total: number;
	/** Доля от всех заказов периода, включая отменённые */
	rate: number;
	byCustomer: number;
	byStaff: number;
	fromStatus: Partial<Record<OrderStatus, number>>;
	recent: RecentCancellation[];
}

/** На текущий момент: корзины с товарами, не тронутые сутки */
export interface CartStats {
	abandoned: number;
	abandonedValue: string;
}

export interface TopProduct {
	productId: number;
	name: string;
	/** null, если товар уже удалён */
	slug: string | null;
	quantity: number;
	revenue: string;
}

export interface ProductStats {
	top: TopProduct[];
	activeTotal: number;
	noSales: number;
	outOfStock: number;
	lowStock: number;
}

export interface OperationsStats {
	/** На текущий момент, не за период */
	pendingTotal: number;
	/** Новые заказы, которые никто не взял за сутки */
	pendingOverdue: number;
	confirmedTotal: number;
	/** Удалённая точка приходит с locationId и name = null, чтобы сумма сходилась с pickupOrders */
	byPickupLocation: { locationId: number | null; name: string | null; orders: number }[];
}

export interface CustomerStats {
	new: number;
	buyers: number;
	repeat: number;
	repeatRate: number;
}

export interface FailureStats {
	mailFailed: number;
}

export interface AdminStats {
	range: StatsRange;
	previous: { from: string; to: string };
	sales: SalesStats;
	daily: DailyPoint[];
	cancellations: CancellationStats;
	carts: CartStats;
	products: ProductStats;
	operations: OperationsStats;
	customers: CustomerStats;
	failures: FailureStats;
}
