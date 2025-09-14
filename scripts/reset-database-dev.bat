@echo off
REM Windows 배치 파일 - 개발용 빠른 데이터베이스 리셋
REM Windows 명령 프롬프트에서 실행 가능

setlocal enabledelayedexpansion

echo 🔄 개발용 데이터베이스 리셋 시작...

REM Docker 설치 확인
echo 📋 Docker 설치 확인 중...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker가 설치되지 않았거나 실행되지 않습니다.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose가 설치되지 않았습니다.
    pause
    exit /b 1
)

REM 1. 컨테이너 중지 및 제거
echo 📦 컨테이너 중지 중...
docker-compose down
if errorlevel 1 (
    echo ⚠️  일부 컨테이너 중지에 실패했습니다. 계속 진행합니다.
)

REM 2. 데이터베이스 볼륨 강제 삭제
echo 🗑️  데이터베이스 볼륨 삭제 중...

REM 여러 볼륨 이름 시도
docker volume rm py-jumo_app-db-data 2>nul
if not errorlevel 1 (
    echo    볼륨 'py-jumo_app-db-data' 삭제 완료
    goto volume_deleted
)

docker volume rm app-db-data 2>nul
if not errorlevel 1 (
    echo    볼륨 'app-db-data' 삭제 완료
    goto volume_deleted
)

echo    볼륨이 이미 존재하지 않거나 삭제할 수 없습니다.

:volume_deleted

REM 3. 데이터베이스만 시작
echo 🚀 데이터베이스 시작 중...
docker-compose up -d db
if errorlevel 1 (
    echo ❌ 데이터베이스 시작에 실패했습니다.
    pause
    exit /b 1
)

REM 4. 연결 대기
echo ⏳ 데이터베이스 준비 대기 중...
timeout /t 15 /nobreak >nul

REM PostgreSQL 연결 확인 (최대 10회 시도)
set /a retry_count=0
set /a max_retries=10

:check_db
set /a retry_count+=1
docker-compose exec -T db pg_isready -U app -d app >nul 2>&1
if not errorlevel 1 (
    echo    데이터베이스 연결 확인됨
    goto db_ready
)

if !retry_count! GEQ !max_retries! (
    echo ⚠️  데이터베이스 연결 확인에 실패했습니다. 계속 진행합니다.
    goto db_ready
)

echo|set /p="."
timeout /t 2 /nobreak >nul
goto check_db

:db_ready

REM 5. 마이그레이션 실행
echo 🔧 마이그레이션 실행 중...
cd backend

REM UV 확인 및 마이그레이션 실행
uv --version >nul 2>&1
if not errorlevel 1 (
    uv run alembic upgrade head
    if errorlevel 1 (
        echo ⚠️  마이그레이션 실행에 실패했습니다.
    )
) else (
    echo ⚠️  UV를 찾을 수 없습니다. Python을 직접 사용해보세요.
    python -m alembic upgrade head
    if errorlevel 1 (
        echo ⚠️  마이그레이션 실행에 실패했습니다.
    )
)

REM 6. 초기 데이터 설정
echo 📊 초기 데이터 설정 중...
if exist "app\initial_data.py" (
    uv run python app/initial_data.py >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  초기 데이터 설정에 실패했습니다.
    )
) else (
    echo ⚠️  초기 데이터 파일이 없습니다.
)

cd ..

REM 7. 전체 서비스 시작
echo 🌐 전체 서비스 시작 중...
docker-compose up -d
if errorlevel 1 (
    echo ⚠️  일부 서비스 시작에 실패했을 수 있습니다.
)

echo ✅ 개발용 데이터베이스 리셋 완료!
echo 📊 서비스 상태:
docker-compose ps

echo.
echo 🌐 접속 정보:
echo    데이터베이스: localhost:5432
echo    Adminer: http://localhost:8080
echo.

pause
