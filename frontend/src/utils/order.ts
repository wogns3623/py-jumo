import type {
  OrderStatus,
  OrderedMenuStatus,
  OrderWithPaymentInfo,
} from "@/client/types.gen";

// 주문 상태 관련 유틸리티
export const getOrderStatusText = (status: OrderStatus) => {
  switch (status) {
    case "ordered":
      return "주문됨";
    case "paid":
      return "결제완료";
    case "rejected":
      return "거부됨";
    case "finished":
      return "완료됨";
    default:
      return status;
  }
};

export const getOrderStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case "ordered":
      return "secondary";
    case "paid":
      return "default";
    case "rejected":
      return "destructive";
    case "finished":
      return "outline";
    default:
      return "outline";
  }
};

// 메뉴 상태 관련 유틸리티
export const getMenuStatusText = (status: OrderedMenuStatus) => {
  switch (status) {
    case "ordered":
      return "주문됨";
    case "cooked":
      return "조리완료";
    case "served":
      return "서빙완료";
    case "rejected":
      return "거부됨";
    default:
      return status;
  }
};

export const getMenuStatusBadgeVariant = (status: OrderedMenuStatus) => {
  switch (status) {
    case "ordered":
      return "outline";
    case "cooked":
      return "secondary";
    case "served":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

// 주문 관리 페이지용 상태 라벨 (더 세분화된 표현)
export const getOrderStatusLabel = (order: OrderWithPaymentInfo) => {
  if (order.grouped_ordered_menus.every((menu) => menu.status === "served"))
    return "완료";
  if (
    order.grouped_ordered_menus.every((menu) => menu.status === "rejected") ||
    order.status === "rejected"
  )
    return "거절";
  if (
    order.grouped_ordered_menus.every(
      (menu) => menu.status === "served" || menu.status === "rejected"
    )
  )
    return "부분 거절";
  if (
    order.grouped_ordered_menus.some(
      (menu) => !menu.menu.is_instant_cook && menu.status === "cooked"
    )
  )
    return "조리중";
  switch (order.status) {
    case "ordered":
      return "주문접수";
    case "paid":
      return "결제완료";
    case "finished":
      return "완료";
    default:
      return order.status;
  }
};

export const getOrderStatusBadgeVariantForLabel = (
  order: OrderWithPaymentInfo
) => {
  if (order.grouped_ordered_menus.every((menu) => menu.status === "served"))
    return "default";
  if (
    order.grouped_ordered_menus.every((menu) => menu.status === "rejected") ||
    order.status === "rejected"
  )
    return "destructive";
  if (
    order.grouped_ordered_menus.every(
      (menu) => menu.status === "served" || menu.status === "rejected"
    )
  )
    return "secondary";

  if (
    order.grouped_ordered_menus.some(
      (menu) => !menu.menu.is_instant_cook && menu.status === "cooked"
    )
  )
    return "secondary";

  switch (order.status) {
    case "ordered":
      return "outline";
    case "paid":
      return "secondary";
    case "finished":
      return "default";
    default:
      return "outline";
  }
};

// 주문 관리 페이지용 메뉴 상태 라벨 (더 세분화된 표현)
export const getMenuStatusLabel = (status: OrderedMenuStatus) => {
  switch (status) {
    case "ordered":
      return "주문접수";
    case "cooked":
      return "조리중";
    case "served":
      return "완료";
    case "rejected":
      return "거절";
    default:
      return status;
  }
};

// 가격 포맷팅
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("ko-KR").format(price) + "원";
};

// 키오스크 주문 판별
export const isKioskOrder = (order: OrderWithPaymentInfo) => {
  return order.team.table.type === "kiosk";
};

// 한국 시간 포맷팅
export const formatKoreanDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatKoreanDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
