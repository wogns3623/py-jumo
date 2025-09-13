import { useMemo } from "react";

export const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TableSessionState {
  tableId: string | null;
  isValidTable: boolean;
}

// 테이블 기반 세션 관리 훅 (URL 파라미터만 사용)
export function useTableSession(tableId: string | null): TableSessionState {
  const isValidTable = useMemo(() => {
    return !!(tableId && uuidRegex.test(tableId));
  }, [tableId]);

  return {
    tableId: isValidTable ? tableId : null,
    isValidTable,
  };
}
