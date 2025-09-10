from typing import TypedDict, NotRequired


class KakaoAlimtalkRequest(TypedDict):
    """카카오 알림톡 요청 모델

    Args:
        plusFriendId (str): 카카오톡 채널명 ((구)플러스친구 아이디)
        templateCode (str): 템플릿 코드
        messages (list[KakaoAlimtalkMessage]): 메시지 정보
        reserveTime (NotRequired[str], optional): 예약 일시 (yyyy-MM-dd HH:mm). Defaults to None.
        reserveTimeZone (NotRequired[str], optional): 예약 일시 타임존. Defaults to None.
    """

    plusFriendId: str
    templateCode: str
    messages: list[dict]
    reserveTime: NotRequired[str]
    reserveTimeZone: NotRequired[str]


class KakaoAlimtalkResponseMessage(TypedDict):
    """카카오 알림톡 응답 메시지 모델

    Args:
        messageId (str): 메시지 아이디
        countryCode (NotRequired[str], optional): 수신자 국가번호. Defaults to None.
        to (str): 수신자 번호
        content (str): 알림톡 메시지 내용
        requestStatusCode (str): 발송요청 상태 코드
        requestStatusName (str): 발송 요청 상태명
        requestStatusDesc (str): 발송 요청 상태 내용
        useSmsFailover (bool): SMS Failover 사용 여부
    """

    messageId: str
    countryCode: NotRequired[str]
    to: str
    content: str
    requestStatusCode: str
    requestStatusName: str
    requestStatusDesc: str
    useSmsFailover: bool


class KakaoAlimtalkResponse(TypedDict):
    """카카오 알림톡 응답 모델

    Args:
        requestId (str): 발송 요청 아이디
        requestTime (str): 발송 요청 시간
        statusCode (str): 요청 상태 코드
        statusName (str): 요청 상태명
        messages (list[KakaoAlimtalkResponseMessage]): 메시지 정보

    응답 Status:
        202: Accepted (발송 요청 완료)
        400: Bad Request
        401: Unauthorized
        403: Forbidden
        404: Not Found
        500: Internal Server Error
    """

    requestId: str
    requestTime: str
    statusCode: str
    statusName: str
    messages: list[KakaoAlimtalkResponseMessage]
