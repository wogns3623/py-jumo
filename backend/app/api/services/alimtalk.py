from app.core.config import settings
from app.models import Restaurants, Waitings, Teams, Tables


def send_waiting_registered(
    restaurant: Restaurants, waiting: Waitings, remaining_count: int
):
    content = f"[{restaurant.name}]\n{waiting.name}님, 웨이팅이 등록되었어요.\n\n남은 팀: {remaining_count}팀"

    settings.alimtalk.send_message(
        {
            "templateCode": "WaitlistRegistration",
            "plusFriendId": "@acorn_soft",
            "messages": [
                {
                    "countryCode": "82",
                    "to": waiting.phone,
                    "content": content,
                    # "buttons": [],
                    "useSmsFailover": False,
                }
            ],
        }
    )


def send_waiting_now_seated(restaurant: Restaurants, waiting: Waitings):
    content = f"[{restaurant.name}]\n{waiting.name}님, 입장 순서가 되었습니다.\n\n현재 바로 입장이 가능하니\n10분 이내에 직원에게 문의해주세요."

    settings.alimtalk.send_message(
        {
            "templateCode": "WaitlistNowSeated",
            "plusFriendId": "@acorn_soft",
            "messages": [
                {
                    "countryCode": "82",
                    "to": waiting.phone,
                    "content": content,
                    "buttons": [
                        {
                            "order": 1,
                            "type": "WL",
                            "name": "위치보기",
                            "linkMobile": "http://money.ipdisk.co.kr:100/publist/HDD1/%EC%A3%BC%EC%A0%90/HYAI.png",
                            "linkPc": "http://money.ipdisk.co.kr:100/publist/HDD1/%EC%A3%BC%EC%A0%90/HYAI.png",
                            "schemeIos": "",
                            "schemeAndroid": "",
                        }
                    ],
                    "useSmsFailover": False,
                }
            ],
        }
    )


def send_waiting_one_left(restaurant: Restaurants, waiting: Waitings):
    content = f"[{restaurant.name}]\n{waiting.name}님, 곧 입장이 가능해요!\n\n앞에 대기 팀이 1팀 남았습니다.\n준비해 주시면 바로 안내드릴 수 있어요."

    settings.alimtalk.send_message(
        {
            "templateCode": "WaitlistOneLeft",
            "plusFriendId": "@acorn_soft",
            "messages": [
                {
                    "countryCode": "82",
                    "to": waiting.phone,
                    "content": content,
                    "buttons": [
                        {
                            "order": 1,
                            "type": "WL",
                            "name": "위치보기",
                            "linkMobile": "http://money.ipdisk.co.kr:100/publist/HDD1/%EC%A3%BC%EC%A0%90/HYAI.png",
                            "linkPc": "http://money.ipdisk.co.kr:100/publist/HDD1/%EC%A3%BC%EC%A0%90/HYAI.png",
                            "schemeIos": "",
                            "schemeAndroid": "",
                        }
                    ],
                    "useSmsFailover": False,
                }
            ],
        }
    )


def send_waiting_calcelled(restaurant: Restaurants, waiting: Waitings):
    content = f"[{restaurant.name}]\n{waiting.name}님, 웨이팅이 취소되었습니다.\n\n이용을 원하시면 다시 접수 부탁드립니다."
    settings.alimtalk.send_message(
        {
            "templateCode": "WaitlistCancelled",
            "plusFriendId": "@acorn_soft",
            "messages": [
                {
                    "countryCode": "82",
                    "to": waiting.phone,
                    "content": content,
                    "useSmsFailover": False,
                }
            ],
        }
    )


def send_kiosk_order_ready(
    restaurant: Restaurants, team: Teams, table: Tables, order_no: int
):
    """키오스크 주문 조리 완료 알림톡 발송"""
    content = f"[{restaurant.name}]\n주문이 완료되었습니다!\n\n주문번호: {order_no}번\n테이블: {table.no}번\n\n지금 가져가실 수 있습니다."

    settings.alimtalk.send_message(
        {
            "templateCode": "KioskOrderReady",
            "plusFriendId": "@acorn_soft",
            "messages": [
                {
                    "countryCode": "82",
                    "to": team.phone,
                    "content": content,
                    "useSmsFailover": False,
                }
            ],
        }
    )
