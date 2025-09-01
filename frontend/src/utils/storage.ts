// 팀 관리 유틸리티 함수들
export const teamUtils = {
  // 로컬 스토리지에서 팀 ID 가져오기
  getTeamId: (): string | null => {
    return localStorage.getItem("teamId");
  },

  // 팀 ID 저장
  setTeamId: (teamId: string): void => {
    localStorage.setItem("teamId", teamId);
  },

  // 팀 ID 삭제
  clearTeamId: (): void => {
    localStorage.removeItem("teamId");
  },

  // URL에서 테이블 ID 추출
  getTableIdFromQuery: (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("table");
  },
};

// 장바구니 관리 유틸리티 함수들
export const cartUtils = {
  // 로컬 스토리지에서 장바구니 가져오기
  getCart: () => {
    const cartData = localStorage.getItem("cart");
    return cartData ? JSON.parse(cartData) : [];
  },

  // 장바구니 저장
  setCart: (cart: any[]) => {
    localStorage.setItem("cart", JSON.stringify(cart));
  },

  // 장바구니 비우기
  clearCart: () => {
    localStorage.removeItem("cart");
  },
};
