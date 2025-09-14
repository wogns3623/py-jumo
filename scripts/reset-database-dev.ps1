# PowerShell 스크립트 - 개발용 빠른 데이터베이스 리셋
# Windows 환경에서 실행 가능

param(
    [switch]$Force = $false
)

# 에러 발생 시 중단
$ErrorActionPreference = "Stop"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Green "🔄 $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

try {
    Write-Info "개발용 데이터베이스 리셋 시작..."

    # Docker 및 Docker Compose 확인
    Write-Info "Docker 설치 확인 중..."
    docker --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker가 설치되지 않았거나 실행되지 않습니다."
    }

    docker-compose --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose가 설치되지 않았습니다."
    }

    # 1. 컨테이너 중지 및 제거
    Write-Info "📦 컨테이너 중지 중..."
    docker-compose down
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "일부 컨테이너 중지에 실패했습니다. 계속 진행합니다."
    }

    # 2. 데이터베이스 볼륨 강제 삭제
    Write-Info "🗑️  데이터베이스 볼륨 삭제 중..."
    
    # 볼륨 이름들을 시도
    $volumeNames = @("py-jumo_app-db-data", "app-db-data", "${env:COMPOSE_PROJECT_NAME}_app-db-data")
    $volumeDeleted = $false
    
    foreach ($volumeName in $volumeNames) {
        try {
            docker volume rm $volumeName 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Info "   볼륨 '$volumeName' 삭제 완료"
                $volumeDeleted = $true
                break
            }
        }
        catch {
            # 볼륨이 존재하지 않거나 삭제 실패
        }
    }
    
    if (-not $volumeDeleted) {
        Write-Warning "   볼륨이 이미 존재하지 않거나 삭제할 수 없습니다."
    }

    # 3. 데이터베이스만 시작
    Write-Info "🚀 데이터베이스 시작 중..."
    docker-compose up -d db
    if ($LASTEXITCODE -ne 0) {
        throw "데이터베이스 시작에 실패했습니다."
    }

    # 4. 연결 대기
    Write-Info "⏳ 데이터베이스 준비 대기 중..."
    Start-Sleep -Seconds 15

    # PostgreSQL 연결 확인
    $maxRetries = 10
    $retryCount = 0
    do {
        try {
            docker-compose exec -T db pg_isready -U app -d app 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Info "   데이터베이스 연결 확인됨"
                break
            }
        }
        catch {}
        
        $retryCount++
        if ($retryCount -ge $maxRetries) {
            Write-Warning "데이터베이스 연결 확인에 실패했습니다. 계속 진행합니다."
            break
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    } while ($retryCount -lt $maxRetries)

    # 5. 마이그레이션 실행
    Write-Info "🔧 마이그레이션 실행 중..."
    Set-Location backend
    
    # UV 및 Python 확인
    try {
        uv --version | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "UV가 설치되지 않았습니다."
        }
    }
    catch {
        Write-Warning "UV를 찾을 수 없습니다. Python을 직접 사용합니다."
        python -m alembic upgrade head
    }
    
    try {
        uv run alembic upgrade head
        if ($LASTEXITCODE -ne 0) {
            throw "마이그레이션 실행에 실패했습니다."
        }
    }
    catch {
        Write-Warning "UV로 마이그레이션 실행 실패. Python을 직접 사용해보세요."
    }

    # 6. 초기 데이터 설정
    Write-Info "📊 초기 데이터 설정 중..."
    if (Test-Path "app/initial_data.py") {
        try {
            uv run python app/initial_data.py
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "초기 데이터 설정에 실패했습니다."
            }
        }
        catch {
            Write-Warning "초기 데이터 설정을 건너뜁니다."
        }
    }
    else {
        Write-Warning "초기 데이터 파일이 없습니다."
    }

    Set-Location ..

    # 7. 전체 서비스 시작
    Write-Info "🌐 전체 서비스 시작 중..."
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "일부 서비스 시작에 실패했을 수 있습니다."
    }

    Write-Info "✅ 개발용 데이터베이스 리셋 완료!"
    Write-Info "📊 서비스 상태:"
    docker-compose ps

    Write-Info ""
    Write-Info "🌐 접속 정보:"
    Write-Info "   데이터베이스: localhost:5432"
    Write-Info "   Adminer: http://localhost:8080"

}
catch {
    Write-Error "스크립트 실행 중 오류가 발생했습니다: $($_.Exception.Message)"
    exit 1
}
finally {
    # 원래 디렉토리로 돌아가기
    if (Get-Location | Select-Object -ExpandProperty Path | Select-String "backend") {
        Set-Location ..
    }
}
