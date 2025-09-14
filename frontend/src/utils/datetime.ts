/**
 * 한국 시간대로 날짜/시간을 포맷팅하는 유틸리티 함수들
 * 백엔드에서 UTC ISO 문자열로 전송된 시간을 한국 시간대로 변환
 */

/**
 * UTC ISO 문자열을 한국 시간대 Date 객체로 변환
 * 브라우저의 로컬 시간대 문제를 해결하기 위해 명시적으로 UTC로 처리
 */
const parseUTCDate = (isoString: string): Date => {
  // ISO 문자열이 'Z'로 끝나지 않으면 UTC 표시 추가
  const utcString = isoString.endsWith("Z") ? isoString : `${isoString}Z`;
  return new Date(utcString);
};

export const formatKoreanDateTime = (isoString: string): string => {
  return parseUTCDate(isoString).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const formatKoreanDate = (isoString: string): string => {
  return parseUTCDate(isoString).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatKoreanTime = (isoString: string): string => {
  return parseUTCDate(isoString).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const formatRelativeTime = (isoString: string): string => {
  const now = new Date();
  const target = parseUTCDate(isoString);
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "방금 전";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return formatKoreanDate(isoString);
  }
};

/**
 * 두 UTC ISO 문자열의 시간 차이를 분 단위로 계산
 */
export const getTimeDifferenceInMinutes = (
  startISOString: string,
  endISOString?: string
): number => {
  const start = parseUTCDate(startISOString);
  const end = endISOString ? parseUTCDate(endISOString) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * UTC ISO 문자열을 Date 객체로 변환 (시간 비교용)
 */
export const parseUTCDateForComparison = (isoString: string): Date => {
  return parseUTCDate(isoString);
};
