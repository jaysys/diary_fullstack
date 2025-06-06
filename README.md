# 프런트 + 백엔드 + DB 풀스택 일기장 웹앱

이 프로젝트는 React 프론트엔드와 Flask 백엔드, sqlite3 데이터베이스로 구성된 사용자 인증/권한 기반 일기장 웹앱입니다.

## 프로젝트 구조

```
fullstack/
├── backend/         # Flask 백엔드
│   ├── app.py
│   └── requirements.txt
├── frontend/        # React 프론트엔드
│   ├── package.json
│   ├── public/
│   └── src/
└── README.md
```

---

## 백엔드(Flask) 실행 방법

1. 가상환경 활성화(필요시)
2. 의존성 설치
3. 서버 실행

```bash
cd backend
uv pip install -r requirements.txt
uv run python app.py
```

- 서버는 기본적으로 `localhost:5001`에서 실행됩니다.
- sqlite3 데이터베이스 파일(`diary.db`)이 backend 폴더에 자동 생성됩니다.
- **CORS 및 세션 인증 지원**: `app.secret_key`와 `CORS(app, supports_credentials=True, origins=["http://localhost:3000"])` 적용.

---

## 프론트엔드(React) 실행 방법

1. 의존성 설치
2. 개발 서버 실행

```bash
cd frontend
npm install
npm start
```

- 개발 서버는 기본적으로 `localhost:3000`에서 실행됩니다.
- 프론트엔드는 백엔드(`localhost:5001`)와 연동합니다.

---

## 주요 기능
- **사용자 인증/권한**: 로그인 후에만 일기장 접근 가능. 세션 기반 인증.
- **일기장**
  - 내 일기만 작성/조회/수정/삭제 (관리자는 전체 일기 접근/수정/삭제)
  - 일기 작성자명, 작성일시 표시
- **어드민(관리자) 기능**
  - 사용자 목록 조회/추가/수정/삭제 (최고관리자 jay 삭제 불가)
  - 관리자 권한 부여/회수
- **보안**
  - 비밀번호는 SHA-256 해시로 안전하게 저장
  - 모든 API 요청은 세션 쿠키로 인증, CORS 및 credentials 완전 지원

---

## 사용자 및 권한
- **최초 실행 시** 최고관리자 계정이 자동 생성됩니다.
  - 아이디: `jay`, 비밀번호: `234567`
- 관리자는 모든 사용자의 일기 및 사용자 관리 기능 사용 가능
- 일반 사용자는 본인 일기만 접근/수정/삭제 가능

---

## API 엔드포인트 요약

### 인증 관련
- `POST /api/login` : 로그인 (username, password)
- `POST /api/logout` : 로그아웃
- `GET /api/me` : 현재 로그인 사용자 정보

### 일기장
- `GET /api/diaries` : (관리자=전체, 일반=본인) 일기 목록
- `POST /api/diaries` : 내 일기 작성
- `PUT /api/diaries/<id>` : 내 일기 수정 (관리자는 전체)
- `DELETE /api/diaries/<id>` : 내 일기 삭제 (관리자는 전체)

### 사용자 관리 (관리자만)
- `GET /api/users` : 사용자 목록
- `POST /api/users` : 사용자 추가
- `PUT /api/users/<id>` : 사용자 정보 수정
- `DELETE /api/users/<id>` : 사용자 삭제 (최고관리자 jay 삭제 불가)

---

## CORS 및 세션 설정
- Flask 서버는 `http://localhost:3000`에서 오는 요청만 credentials(세션 쿠키)와 함께 허용합니다.
- 모든 프론트엔드 fetch 요청은 `credentials: 'include'` 옵션을 사용해야 정상 동작합니다.

---

## 데이터 흐름 예시
1. **로그인/세션 인증**
    - 로그인 시 세션 쿠키 발급, 이후 모든 API 요청에 자동 인증
    - 미로그인 상태에서는 모든 주요 API 접근 불가
2. **일기 작성/조회/수정/삭제**
    - 일반 사용자는 본인 일기만, 관리자는 전체 일기 가능
    - 일기 카드에 작성자명 표시
3. **사용자 관리(어드민)**
    - 관리자만 접근 가능, 비관리자는 접근 시 안내 메시지 표시

---

## 참고 및 확장성
- 백엔드와 프론트엔드 모두 실행되어 있어야 정상적으로 이용 가능합니다.
- 포트 충돌 시, 다른 포트를 사용하거나 기존 프로세스를 종료해 주세요.
- 상업적 서비스 확장 시 JWT 기반 인증, HTTPS, 입력값 검증, API rate limit, 사용자별 일기 검색 등 추가 가능

---

### 문의/이슈
추가 기능 요청이나 오류 문의는 이슈로 남겨 주세요.

## 프런트엔드와 백엔드 연동 구조 (Technical Details)

### 전체 아키텍처
- **React 프론트엔드**는 사용자의 입력을 받아 화면을 렌더링하고, 백엔드와 HTTP API를 통해 데이터를 주고받습니다.
- **Flask 백엔드**는 RESTful API 엔드포인트를 제공하며, sqlite3 데이터베이스에 일기 데이터를 저장/조회/수정/삭제합니다.

### 통신 방식
- 프론트엔드는 `fetch()`를 사용해 백엔드(Flask)로 HTTP 요청을 보냅니다.
- API 엔드포인트 예시:
    - `GET    /api/diaries`        → 일기 전체 목록 조회
    - `POST   /api/diaries`        → 새 일기 작성
    - `PUT    /api/diaries/<id>`   → 특정 일기 수정
    - `DELETE /api/diaries/<id>`   → 특정 일기 삭제
- 모든 요청/응답 데이터는 JSON 형식으로 주고받습니다.

### CORS (Cross-Origin Resource Sharing)
- 개발 환경에서 React(3000번 포트)와 Flask(5001번 포트)가 서로 다른 포트에서 동작하므로, CORS 정책이 필요합니다.
- Flask 백엔드에 `flask-cors`를 적용하여 모든 도메인에서의 API 접근을 허용합니다.

### 데이터 흐름 예시
1. **일기 작성**
    - 사용자가 프론트엔드에서 제목/내용을 입력하고 "일기 작성" 버튼 클릭
    - 프론트엔드가 백엔드 `/api/diaries`로 POST 요청 전송
    - 백엔드는 sqlite3에 데이터 저장 후, 성공 응답 반환
    - 프론트엔드는 일기 목록을 다시 불러와 최신 상태로 갱신
2. **일기 목록 조회**
    - 프론트엔드가 `/api/diaries`로 GET 요청
    - 백엔드는 DB에서 모든 일기 데이터를 조회하여 JSON으로 반환
3. **일기 수정/삭제**
    - 프론트엔드에서 수정/삭제 버튼 클릭 시, 각각 PUT/DELETE 요청 전송
    - 백엔드에서 DB 반영 후 성공 응답 반환, 프론트엔드가 목록 갱신

### 보안 및 확장성 참고
- 현재는 인증/인가 없이 누구나 접근 가능한 구조입니다.
- 상업적 서비스 확장 시 JWT 기반 인증, HTTPS, 입력값 검증, API rate limit 등을 추가할 수 있습니다.

---

### 문의/이슈
추가 기능 요청이나 오류 문의는 이슈로 남겨 주세요.
