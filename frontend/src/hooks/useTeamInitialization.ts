import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import { TeamsService } from "@/client";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 팀 초기화 및 관리 로직을 담당하는 훅
export function useTeamInitialization(tableId: string | null) {
  const [teamId, setTeamId] = useLocalStorage<string>("teamId", "");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState<Error | null>(null);

  // 초기화 한 번만 실행되도록 ref 사용
  const hasInitialized = useRef(false);

  useEffect(() => {
    const initializeTeam = async () => {
      // 이미 초기화했거나 진행 중인 경우 중단
      if (hasInitialized.current || isCreatingTeam) {
        return;
      }

      hasInitialized.current = true;

      if (!tableId || !uuidRegex.test(tableId)) {
        setIsInitialized(true);
        return;
      }

      // 기존 팀 ID 확인
      if (teamId) {
        setIsInitialized(true);
        return;
      }

      // 새 팀 생성
      setIsCreatingTeam(true);
      setCreateTeamError(null);

      try {
        const response = await TeamsService.createTeam({
          requestBody: {
            table_id: tableId,
            // waiting_id: null,
          },
        });

        // 생성된 팀 ID를 로컬 스토리지에 저장
        setTeamId(response.id!);
      } catch (error) {
        console.error("Failed to create team:", error);
        setCreateTeamError(error as Error);
        // 실패 시 다시 시도할 수 있도록 플래그 리셋
        hasInitialized.current = false;
      } finally {
        setIsCreatingTeam(false);
        setIsInitialized(true);
      }
    };

    initializeTeam();
  }, [tableId]); // tableId만 의존성으로 사용

  return {
    teamId,
    isInitialized,
    isCreatingTeam,
    createTeamError,
  };
}
