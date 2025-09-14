# 데이터베이스 리셋 스크립트 가이드

## 🔧 스크립트 종류

### 1. Linux/macOS 스크립트
- **`reset-database.sh`** - 안전한 완전 리셋 (사용자 확인 필요)
- **`reset-database-dev.sh`** - 개발용 빠른 리셋 (즉시 실행)

### 2. Windows 스크립트
- **`reset-database-dev.ps1`** - PowerShell용 개발 리셋 스크립트
- **`reset-database-dev.bat`** - 명령 프롬프트용 개발 리셋 스크립트

## 🚀 사용법

### Linux/macOS
```bash
# 안전한 리셋 (확인 필요)
./scripts/reset-database.sh

# 개발용 빠른 리셋
./scripts/reset-database-dev.sh
```

### Windows

#### PowerShell (권장)
```powershell
# PowerShell에서 실행 정책 설정 (최초 1회)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 개발용 빠른 리셋
.\scripts\reset-database-dev.ps1
```

#### 명령 프롬프트
```cmd
REM 관리자 권한으로 명령 프롬프트 실행 후
scripts\reset-database-dev.bat
```

## 🛠️ 사전 요구사항

### 모든 플랫폼
- Docker Desktop 설치 및 실행
- Docker Compose 설치
- 프로젝트 루트 디렉토리에서 실행

### Windows 추가 요구사항
- PowerShell 5.0 이상 (PowerShell 스크립트용)
- UV 또는 Python 설치 (마이그레이션용)

### 환경변수 확인

스크립트 실행 전 `.env` 파일에 다음 변수들이 설정되어 있는지 확인하세요:

```env
POSTGRES_USER=app
POSTGRES_PASSWORD=your_password
POSTGRES_DB=app
DOMAIN=localhost
STACK_NAME=py-jumo
```

## ⚡ 수행 작업

1. **컨테이너 중지**: 실행 중인 모든 Docker Compose 서비스 중지
2. **볼륨 삭제**: 데이터베이스 데이터가 저장된 볼륨 완전 삭제
3. **이미지 정리**: 불필요한 Docker 이미지 정리
4. **데이터베이스 시작**: PostgreSQL 컨테이너 새로 시작
5. **연결 대기**: 데이터베이스 준비 상태까지 대기
6. **마이그레이션**: Alembic으로 스키마 생성
7. **초기 데이터**: `initial_data.py` 실행 (존재하는 경우)
8. **전체 서비스**: 모든 Docker Compose 서비스 시작

## ⚠️ 주의사항

- **데이터 손실**: 모든 데이터베이스 데이터가 영구 삭제됩니다
- **백업**: 중요한 데이터가 있다면 미리 백업하세요
- **환경**: 개발 환경에서만 사용하는 것을 권장합니다

## 🔍 문제해결

### 권한 오류

```bash
chmod +x scripts/reset-database.sh
chmod +x scripts/reset-database-dev.sh
```

### Docker 볼륨이 삭제되지 않을 때

```bash
# 수동으로 볼륨 확인 및 삭제
docker volume ls
docker volume rm py-jumo_app-db-data
```

### 데이터베이스 연결 실패

```bash
# 컨테이너 로그 확인
docker-compose logs db

# 수동으로 연결 테스트
docker-compose exec db pg_isready -U app -d app
```

## 📊 상태 확인

```bash
# 서비스 상태 확인
docker-compose ps

# 데이터베이스 로그 확인
docker-compose logs db

# 백엔드 로그 확인
docker-compose logs backend
```
