#!/bin/bash

# 개발용 빠른 데이터베이스 리셋 스크립트
# 확인 없이 바로 실행 (개발 환경 전용)

set -e

echo "🔄 개발용 데이터베이스 리셋 시작..."

# 1. 컨테이너 중지 및 제거
echo "📦 컨테이너 중지 중..."
docker-compose down

# 2. 데이터베이스 볼륨 강제 삭제
echo "🗑️  데이터베이스 볼륨 삭제 중..."
docker volume rm py-jumo_app-db-data 2>/dev/null || \
docker volume rm app-db-data 2>/dev/null || \
docker volume rm "${COMPOSE_PROJECT_NAME}_app-db-data" 2>/dev/null || \
echo "   볼륨이 이미 존재하지 않음"

# 3. 데이터베이스만 시작
echo "🚀 데이터베이스 시작 중..."
docker-compose up -d db

# 4. 연결 대기 (짧은 시간)
echo "⏳ 데이터베이스 준비 대기 중..."
sleep 10

# 5. 마이그레이션 실행
echo "🔧 마이그레이션 실행 중..."
cd backend
uv run alembic upgrade head

# 6. 초기 데이터 설정
echo "📊 초기 데이터 설정 중..."
[ -f "app/initial_data.py" ] && uv run python app/initial_data.py

cd ..

# 7. 전체 서비스 시작
echo "🌐 전체 서비스 시작 중..."
docker-compose up -d

echo "✅ 개발용 데이터베이스 리셋 완료!"
echo "📊 서비스 상태:"
docker-compose ps
