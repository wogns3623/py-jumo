from io import BytesIO
import tempfile
import platform
from PIL import Image
from PIL import ImageChops
import requests
from bs4 import BeautifulSoup as bs
import platform
import tempfile
import datetime
from dateutil import parser
import os
import json
from pathlib import Path
import math, operator
from functools import reduce
import re
from playwright.sync_api import sync_playwright
import time


TMP_DIR = Path("/tmp" if platform.system() == "Darwin" else tempfile.gettempdir())
CURRENT_PACKAGE_DIR = Path(__file__).parent.absolute()
os.chdir(CURRENT_PACKAGE_DIR)


# from repository 'simple_bank_korea' by Beomi at Github
def get_keypad_img():
    retries = 1
    area_hash_list = []
    area_pattern = re.compile("'(\w+)'")
    with sync_playwright() as playwright:
        # browser = playwright.chromium.launch(channel="chrome")
        browser = playwright.firefox.launch(channel="firefox")
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()
        page.goto(
            "https://obank.kbstar.com/quics?page=C025255&cc=b028364:b028702&QSL=F"
        )
        while retries <= 3:
            try:
                page.wait_for_selector(
                    'xpath=//*[@id="loading_img"]', state="attached", timeout=1000
                )
            finally:
                try:
                    page.wait_for_selector(
                        'xpath=//*[@id="loading_img"]', state="detached", timeout=10000
                    )
                    break
                except:
                    page.goto(
                        "https://obank.kbstar.com/quics?page=C025255&cc=b028364:b028702&QSL=F"
                    )
                    retries += 1
        cookies = context.cookies()
        KEYPAD_USEYN = page.get_attribute('input[id*="KEYPAD_USEYN"]', "value")
        keymap = page.get_attribute('img[src*="quics"]', "usemap").replace(
            "#divKeypad", ""
        )[:-3]
        area_list = page.locator("map > area")
        area_list_count = area_list.count()
        for i in range(area_list_count):
            element = area_list.nth(i)
            re_matched = area_pattern.findall(element.get_attribute("onmousedown"))
            if re_matched:
                area_hash_list.append(re_matched[0])
        img_url = page.get_attribute('img[src*="quics"]', "src")
        page.goto("https://obank.kbstar.com" + img_url)
        buffer = page.screenshot()
        screenshot = Image.open(BytesIO(buffer))
        left = 875 - 17
        top = 414 - 42
        right = left + 205
        bottom = top + 336
        real = screenshot.crop((left, top, right, bottom))
        browser.close()
    JSESSIONID = ""
    QSID = ""
    for c in cookies:
        if c["name"] == "JSESSIONID":
            JSESSIONID = c["value"]
        elif c["name"] == "QSID":
            QSID = c["value"]
    if JSESSIONID == "":
        print("no JSESSIONID")
    if QSID == "":
        print("no QSID")

    # Get list
    num_sequence = _get_keypad_num_list(real)

    PW_DIGITS = {}
    # FIXED
    PW_DIGITS["1"] = area_hash_list[0]
    PW_DIGITS["2"] = area_hash_list[1]
    PW_DIGITS["3"] = area_hash_list[2]
    PW_DIGITS["4"] = area_hash_list[3]
    PW_DIGITS["6"] = area_hash_list[5]

    # Floating..
    for idx, num in enumerate(num_sequence):
        if idx == 0:
            PW_DIGITS[str(num)] = area_hash_list[4]
        elif idx == 1:
            PW_DIGITS[str(num)] = area_hash_list[6]
        elif idx == 2:
            PW_DIGITS[str(num)] = area_hash_list[7]
        elif idx == 3:
            PW_DIGITS[str(num)] = area_hash_list[8]
        elif idx == 4:
            PW_DIGITS[str(num)] = area_hash_list[9]

    return {
        "JSESSIONID": JSESSIONID,
        "QSID": QSID,
        "KEYMAP": keymap,
        "PW_DIGITS": PW_DIGITS,
        "KEYPAD_USEYN": KEYPAD_USEYN,
    }


def rmsdiff(im1, im2):
    h = ImageChops.difference(im1, im2).histogram()
    return math.sqrt(
        reduce(operator.add, map(lambda h, i: h * (i**2), h, range(256)))
        / (float(im1.size[0]) * im1.size[1])
    )


def _get_keypad_num_list(img):
    img = img.convert("RGBA")
    # 57x57 box
    box_5th = Image.open(
        Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "box_5th.png")
    ).convert("RGBA")
    box_7th = Image.open(
        Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "box_7th.png")
    ).convert("RGBA")
    box_8th = Image.open(
        Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "box_8th.png")
    ).convert("RGBA")
    box_9th = Image.open(
        Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "box_9th.png")
    ).convert("RGBA")
    box_0th = Image.open(
        Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "box_0th.png")
    ).convert("RGBA")

    box_dict = {
        "5": box_5th,
        "7": box_7th,
        "8": box_8th,
        "9": box_9th,
        "0": box_0th,
    }

    # 57x57 box
    crop_5th = img.crop(box=(74, 99, 131, 156))
    crop_7th = img.crop(box=(16, 157, 73, 214))
    crop_8th = img.crop(box=(74, 157, 131, 214))
    crop_9th = img.crop(box=(132, 157, 189, 214))
    crop_0th = img.crop(box=(74, 215, 131, 272))
    # img.save(Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "keypad.png"))
    # crop_5th.save(Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "crop_5th.png"))
    # crop_7th.save(Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "crop_7th.png"))
    # crop_8th.save(Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "crop_8th.png"))
    # crop_9th.save(Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "crop_9th.png"))
    # crop_0th.save(Path.joinpath(CURRENT_PACKAGE_DIR, "assets", "crop_0th.png"))

    crop_list = [crop_5th, crop_7th, crop_8th, crop_9th, crop_0th]

    keypad_num_list = []

    for idx, crop in enumerate(crop_list):
        for key, box in box_dict.items():
            try:
                diff = rmsdiff(crop, box)
                if diff < 5:
                    keypad_num_list += [key]
            except Exception as e:
                print(e)
    return keypad_num_list


def get_transactions(
    bank_num, birthday, password, days=30, start_date=None, cache=False
):
    def _get_transactions(
        VIRTUAL_KEYPAD_INFO, bank_num, birthday, password, days, start_date
    ):
        PW_DIGITS = VIRTUAL_KEYPAD_INFO["PW_DIGITS"]
        KEYMAP = VIRTUAL_KEYPAD_INFO["KEYMAP"]
        JSESSIONID = VIRTUAL_KEYPAD_INFO["JSESSIONID"]
        QSID = VIRTUAL_KEYPAD_INFO["QSID"]
        KEYPAD_USEYN = VIRTUAL_KEYPAD_INFO["KEYPAD_USEYN"]

        today_list = []
        month_before_list = []

        bank_num = str(bank_num)
        birthday = str(birthday)
        password = str(password)
        hexed_pw = ""
        days = int(days)
        for p in password:
            hexed_pw += PW_DIGITS[str(p)]

        today = datetime.datetime.today()
        today_list.append(today)
        if start_date == None:
            month_before = today - datetime.timedelta(days=days)
            month_before_list.append(month_before)
        else:
            start_date = str(start_date)
            start_date = datetime.datetime.strptime(start_date, "%Y%m%d")
            days = (today - start_date).days  # int
            assert days >= 0
            bunch, remnant = divmod(days, 180)
            if bunch > 0:
                for i in range(bunch, -1, -1):
                    if i == bunch:
                        month_before = today - datetime.timedelta(days=180)
                        month_before_list.append(month_before)
                    elif i == 0:
                        today_list.append(month_before)
                        month_before_list.append(start_date)
                    else:
                        today_list.append(month_before)
                        month_before = month_before - datetime.timedelta(days=180)
                        month_before_list.append(month_before)
            else:
                month_before = start_date
                month_before_list.append(month_before)

        # basic data when crawling
        cookies = {
            "_KB_N_TIKER": "N",
            "JSESSIONID": JSESSIONID,
            "QSID": QSID,
            "delfino.recentModule": "G3",
        }

        headers = {
            "Pragma": "no-cache",
            "Origin": "https://obank.kbstar.com",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "ko-KR,ko;q=0.8,en-US;q=0.6,en;q=0.4,la;q=0.2,da;q=0.2",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded;  charset=UTF-8",
            "Accept": "text/html, */*; q=0.01",
            "Cache-Control": "no-cache",
            "X-Requested-With": "XMLHttpRequest",
            "Connection": "keep-alive",
            "Referer": "https://obank.kbstar.com/quics?page=C025255&cc=b028364:b028702&QSL=F",
            "DNT": "1",
        }

        params = (
            ("chgCompId", "b028770"),
            ("baseCompId", "b028702"),
            ("page", "C025255"),
            ("cc", "b028702:b028770"),
        )

        transaction_list = []

        for today, month_before in zip(today_list, month_before_list):
            this_year = today.strftime("%Y")
            this_month = today.strftime("%m")
            this_day = today.strftime("%d")
            this_all = today.strftime("%Y%m%d")
            month_before_year = month_before.strftime("%Y")
            month_before_month = month_before.strftime("%m")
            month_before_day = month_before.strftime("%d")
            month_before_all = month_before.strftime("%Y%m%d")
            breakthrough = True
            while breakthrough == True:
                data = [
                    ("KEYPAD_TYPE_{}".format(KEYMAP), "3"),
                    ("KEYPAD_HASH_{}".format(KEYMAP), hexed_pw),
                    ("KEYPAD_USEYN_{}".format(KEYMAP), KEYPAD_USEYN),
                    ("KEYPAD_INPUT_{}".format(KEYMAP), "\ube44\ubc00\ubc88\ud638"),
                    ("signed_msg", ""),
                    ("\uc694\uccad\ud0a4", ""),
                    ("\uacc4\uc88c\ubc88\ud638", bank_num),
                    ("\uc870\ud68c\uc2dc\uc791\uc77c\uc790", month_before_all),
                    ("\uc870\ud68c\uc885\ub8cc\uc77c", this_all),
                    ("\uace0\uac1d\uc2dd\ubcc4\ubc88\ud638", ""),
                    ("\ube60\ub978\uc870\ud68c", "Y"),
                    ("\uc870\ud68c\uacc4\uc88c", bank_num),
                    ("\ube44\ubc00\ubc88\ud638", password),
                    ("USEYN_CHECK_NAME_{}".format(KEYMAP), "Y"),
                    ("\uac80\uc0c9\uad6c\ubd84", "2"),
                    ("\uc8fc\ubbfc\uc0ac\uc5c5\uc790\ubc88\ud638", birthday),
                    ("\uc870\ud68c\uc2dc\uc791\ub144", month_before_year),
                    ("\uc870\ud68c\uc2dc\uc791\uc6d4", month_before_month),
                    ("\uc870\ud68c\uc2dc\uc791\uc77c", month_before_day),
                    ("\uc870\ud68c\ub05d\ub144", this_year),
                    ("\uc870\ud68c\ub05d\uc6d4", this_month),
                    ("\uc870\ud68c\ub05d\uc77c", this_day),
                    ("\uc870\ud68c\uad6c\ubd84", "2"),
                    ("\uc751\ub2f5\ubc29\ubc95", "2"),
                ]

                r = requests.post(
                    "https://obank.kbstar.com/quics",
                    headers=headers,
                    params=params,
                    cookies=cookies,
                    data=data,
                )
                soup = bs(r.text, "html.parser")
                assert soup.select("#pop_contents > table.tType01 > tbody > tr")

                transactions = soup.select("#pop_contents > table.tType01 > tbody > tr")
                if len(transactions) >= 200:
                    tdn = transactions[-2].select("td")
                    yes = tdn[0].text
                    yes = yes[:10] + " " + yes[10:]
                    _yse = parser.parse(yes)
                    this_year = _yse.strftime("%Y")
                    this_month = _yse.strftime("%m")
                    this_day = _yse.strftime("%d")
                    this_all = _yse.strftime("%Y%m%d")
                    breakthrough = True
                else:
                    breakthrough = False

                for idx, value in enumerate(transactions):
                    tds = value.select("td")
                    if not idx % 2:
                        _date = tds[0].text
                        _date = _date[:10] + " " + _date[10:]
                        try:
                            date = parser.parse(_date)  # 날짜: datetime
                        except:
                            continue
                        amount = -int(tds[3].text.replace(",", "")) or int(
                            tds[4].text.replace(",", "")
                        )  # 입금 / 출금액: int
                        balance = int(tds[5].text.replace(",", ""))  # 잔고: int
                        detail = dict(date=date, amount=amount, balance=balance)
                    else:
                        transaction_by = tds[0].text.strip()  # 거래자(입금자 등): str
                        tmp = dict(transaction_by=transaction_by)
                        transaction_list.append({**detail, **tmp})

        # eliminate duplicates
        newlist = []
        for x in transaction_list:
            if x not in newlist:
                newlist.append(x)
        return newlist

    # Caching
    VIRTUAL_KEYPAD_INFO_JSON = os.path.join(TMP_DIR, "kb_{}.json".format(bank_num))
    if cache:
        if os.path.exists(VIRTUAL_KEYPAD_INFO_JSON):
            fp = open(VIRTUAL_KEYPAD_INFO_JSON)
            VIRTUAL_KEYPAD_INFO = json.load(fp)
            fp.close()
        else:
            VIRTUAL_KEYPAD_INFO = get_keypad_img()
            fp = open(VIRTUAL_KEYPAD_INFO_JSON, "w+")
            json.dump(VIRTUAL_KEYPAD_INFO, fp)
            fp.close()
    else:
        VIRTUAL_KEYPAD_INFO = get_keypad_img()

    result = _get_transactions(
        VIRTUAL_KEYPAD_INFO, bank_num, birthday, password, days, start_date
    )
    if result:
        return result
    else:
        print("Session Expired! Get new touch keys..")
        NEW_VIRTUAL_KEYPAD_INFO = get_keypad_img()
        if cache:
            fp = open(VIRTUAL_KEYPAD_INFO_JSON, "w+")
            json.dump(NEW_VIRTUAL_KEYPAD_INFO, fp)
            fp.close()
        return _get_transactions(
            NEW_VIRTUAL_KEYPAD_INFO, bank_num, birthday, password, days, start_date
        )
