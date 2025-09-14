import base64
import hashlib
import hmac
import json
import time
import requests


from .models import KakaoAlimtalkRequest, KakaoAlimtalkResponse


class KakaoAlimtalk:
    def __init__(self, *, service_id: str, access_key: str, secret_key: str) -> None:
        self.__service_id = service_id
        self.__access_key = access_key
        self.__secret_key = secret_key
        self.__base_url = "https://sens.apigw.ntruss.com"

    def send_message(
        self,
        body: KakaoAlimtalkRequest,
    ) -> KakaoAlimtalkResponse:
        method = "POST"
        url = f"/alimtalk/v2/services/{self.__service_id}/messages"
        timestamp = int(time.time() * 1000)
        signature = self.__make_signature(timestamp, method, url)

        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "x-ncp-apigw-timestamp": str(timestamp),
            "x-ncp-iam-access-key": self.__access_key,
            "x-ncp-apigw-signature-v2": signature,
        }
        api_url = f"{self.__base_url}{url}"

        response = requests.post(api_url, headers=headers, data=json.dumps(body))
        response.raise_for_status()

        print("KakaoAlimtalk response:", response.json())
        return response.json()

    def __make_signature(
        self,
        timestamp: int,
        method: str,
        url: str,
    ) -> str:
        message = f"{method} {url}\n{timestamp}\n{self.__access_key}"
        message_byte = bytes(message, "utf-8")
        secret_key_byte = bytes(self.__secret_key, "utf-8")

        signing_key = hmac.new(
            secret_key_byte, message_byte, digestmod=hashlib.sha256
        ).digest()
        signature = base64.b64encode(signing_key).decode()

        return signature

    def __parse_signature(self, signature: str) -> str:
        b64_decoded = base64.b64decode(signature)

        decrypted = hmac.new(
            bytes(self.__secret_key, "utf-8"), b64_decoded, digestmod=hashlib.sha256
        ).hexdigest()

        return decrypted


if __name__ == "__main__":
    import os

    service_id = os.getenv("KAKAO_SERVICE_ID", "")
    access_key = os.getenv("KAKAO_ACCESS_KEY", "")
    secret_key = os.getenv("KAKAO_SECRET_KEY", "")

    alimtalk = KakaoAlimtalk(
        service_id=service_id,
        access_key=access_key,
        secret_key=secret_key,
    )

    signature = alimtalk.__make_signature(
        timestamp=(int(time.time() * 1000)),
        method="POST",
        url="/alimtalk/v2/services/{serviceId}/messages",
    )
    print(signature)
