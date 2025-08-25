from typing import TypedDict, NotRequired


class KakaoAlimtalkRequestItemHighlight(TypedDict):
    """아이템 하이라이트

    Args:
        title (str): 아이템 하이라이트 제목
        description (str): 아이템 하이라이트 설명
    """

    title: str
    description: str


class KakaoAlimtalkRequestItemlistElement(TypedDict):
    """아이템 리스트 요소

    Args:
        title (str): 아이템 리스트 제목
        description (str): 아이템 리스트 설명
    """

    title: str
    description: str


class KakaoAlimtalkRequestItemSummary(TypedDict):
    """아이템 요약 정보

    Args:
        title (str): 아이템 요약 제목
        description (str): 아이템 요약 설명
    """

    title: str
    description: str


class KakaoAlimtalkRequestItem(TypedDict):
    """아이템 리스트

    Args:
        list (list[KakaoAlimtalkItemlistElement]): 아이템 리스트
        summary (NotRequired[KakaoAlimtalkItemSummary], optional): 아이템 요약 정보. Defaults to None.
    """

    list: list[KakaoAlimtalkRequestItemlistElement]
    summary: NotRequired[KakaoAlimtalkRequestItemSummary]


class KakaoAlimtalkRequestButton(TypedDict):
    """알림톡 메시지 버튼

    Args:
        type (str): 버튼 Type
        name (str): 버튼명
        linkMobile (NotRequired[str], optional): 모바일 링크. Defaults to None.
        linkPc (NotRequired[str], optional): PC 링크. Defaults to None.
        schemeIos (NotRequired[str], optional): iOS 스킴. Defaults to None.
        schemeAndroid (NotRequired[str], optional): Android 스킴. Defaults to None.
    """

    type: str
    name: str
    linkMobile: NotRequired[str]
    linkPc: NotRequired[str]
    schemeIos: NotRequired[str]
    schemeAndroid: NotRequired[str]


class KakaoAlimtalkButtonFailoverConfig(TypedDict):
    """알림톡 메시지 버튼 Failover 설정

    Args:
        type (NotRequired[str], optional): Failover SMS 메시지 Type. Defaults to None.
        from_ (NotRequired[str], optional): Failover SMS 발신번호. Defaults to None.
        subject (NotRequired[str], optional): Failover SMS 제목. Defaults to None.
        content (NotRequired[str], optional): Failover SMS 내용. Defaults to None.
    """

    type: NotRequired[str]
    from_: NotRequired[str]
    subject: NotRequired[str]
    content: NotRequired[str]


class KakaoAlimtalkRequestMessage(TypedDict):
    """메시지 정보

    Args:
        countryCode (NotRequired[str], optional): 수신자 국가번호. Defaults to "82".
        to (str): 수신자번호
        title (NotRequired[str], optional): 알림톡 강조표시 내용. Defaults to None.
        content (str): 알림톡 메시지 내용
        headerContent (NotRequired[str], optional): 알림톡 헤더 내용. Defaults to None.
        itemHighlight (NotRequired[KakaoAlimtalkItemHighlight], optional): 아이템 하이라이트. Defaults to None.
        item (NotRequired[KakaoAlimtalkItem], optional): 아이템 리스트. Defaults to None.
        buttons (NotRequired[list[KakaoAlimtalkButton]], optional): 알림톡 메시지 버튼. Defaults to None.
        useSmsFailover (NotRequired[bool], optional): SMS Failover 사용 여부. Defaults to None.
        failoverConfig (NotRequired[KakaoAlimtalkButtonFailoverConfig], optional): Failover 설정. Defaults to None.
    """

    countryCode: NotRequired[str]
    to: str
    title: NotRequired[str]
    content: str
    headerContent: NotRequired[str]
    itemHighlight: NotRequired[KakaoAlimtalkRequestItemHighlight]
    item: NotRequired[KakaoAlimtalkRequestItem]
    buttons: NotRequired[list[KakaoAlimtalkRequestButton]]
    useSmsFailover: NotRequired[bool]
    failoverConfig: NotRequired[KakaoAlimtalkButtonFailoverConfig]


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
    messages: list[KakaoAlimtalkRequestMessage]
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
