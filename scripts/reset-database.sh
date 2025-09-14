#!/bin/bash

# 데이터베이스 완전 초기화 및 재구축 스크립트
# 주의: 이 스크립트는 모든 데이터를 삭제합니다!

set -e  # 오류 발생 시 스크립트 중단

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 확인 메시지
echo -e "${RED}⚠️  경고: 이 스크립트는 모든 데이터베이스 데이터를 삭제합니다!${NC}"
echo -e "${RED}   모든 테이블, 데이터, 볼륨이 완전히 제거됩니다.${NC}"
echo ""
read -p "정말로 진행하시겠습니까? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "작업이 취소되었습니다."
    exit 0
fi

log_info "데이터베이스 초기화를 시작합니다..."

# 1. 현재 실행 중인 컨테이너 중지 및 제거
log_info "1단계: 실행 중인 컨테이너 중지 및 제거"
docker-compose down --remove-orphans

# 2. 데이터베이스 볼륨 삭제
log_info "2단계: 데이터베이스 볼륨 삭제"
docker volume ls | grep -q "app-db-data" && {
    log_warn "app-db-data 볼륨을 삭제합니다..."
    docker volume rm py-jumo_app-db-data 2>/dev/null || \
    docker volume rm app-db-data 2>/dev/null || \
    docker volume rm "${COMPOSE_PROJECT_NAME}_app-db-data" 2>/dev/null || {
        log_warn "볼륨 삭제 실패 - 수동으로 확인이 필요할 수 있습니다."
        docker volume ls | grep "app-db-data" || log_info "app-db-data 볼륨이 이미 존재하지 않습니다."
    }
} || log_info "app-db-data 볼륨이 존재하지 않습니다."

# 3. 관련 컨테이너 이미지 제거 (선택사항)
log_info "3단계: 데이터베이스 컨테이너 이미지 정리"
docker image prune -f

# 4. 새로운 데이터베이스 서비스 시작
log_info "4단계: 데이터베이스 서비스 시작"
docker-compose up -d db

# 5. 데이터베이스 연결 대기
log_info "5단계: 데이터베이스 연결 대기 중..."
timeout=60
count=0
while [ $count -lt $timeout ]; do
    if docker-compose exec db pg_isready -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app} >/dev/null 2>&1; then
        log_info "데이터베이스가 준비되었습니다!"
        break
    fi
    echo -n "."
    sleep 2
    count=$((count + 2))
done

if [ $count -ge $timeout ]; then
    log_error "데이터베이스 연결 시간이 초과되었습니다."
    exit 1
fi

# 6. 백엔드 마이그레이션 실행
log_info "6단계: 데이터베이스 마이그레이션 실행"
cd backend

# Alembic 마이그레이션 실행
log_info "Alembic 마이그레이션을 실행합니다..."
uv run alembic upgrade head

# 7. 초기 데이터 설정 (선택사항)
log_info "7단계: 초기 데이터 설정"
if [ -f "app/initial_data.py" ]; then
    log_info "초기 데이터를 설정합니다..."
    uv run python app/initial_data.py
else
    log_warn "초기 데이터 파일이 없습니다. 건너뜁니다."
fi

cd ..

# 8. 전체 서비스 시작
log_info "8단계: 전체 서비스 시작"
docker-compose up -d

# 9. 서비스 상태 확인
log_info "9단계: 서비스 상태 확인"
sleep 5
docker-compose ps

# 완료 메시지
echo ""
log_info "✅ 데이터베이스 초기화가 완료되었습니다!"
echo ""
log_info "다음 명령어로 서비스 상태를 확인할 수 있습니다:"
echo "  docker-compose ps"
echo "  docker-compose logs db"
echo ""
log_info "데이터베이스 접속 정보:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: ${POSTGRES_DB:-app}"
echo "  Username: ${POSTGRES_USER:-app}"
echo ""
log_info "Adminer 웹 인터페이스는 다음에서 확인할 수 있습니다:"
echo "  http://localhost:8080 (로컬 환경)"
echo "  https://adminer.${DOMAIN:-yourdomain.com} (배포 환경)"
