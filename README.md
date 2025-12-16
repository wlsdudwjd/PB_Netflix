# JINFLIX (Vue 3 + Vite)

TMDB API를 활용해 로그인/회원가입, 인기/검색/위시리스트/상세 페이지를 제공하는 넷플릭스 스타일 영화 웹앱입니다. 로컬 스토리지에 세션/찜 목록을 저장하고, 카드 호버·전환 애니메이션, 테이블/인피니트 뷰 토글, 필터·정렬, 추천 영화 등 동적 UI를 포함합니다.

Github repository 주소: https://github.com/wlsdudwjd/PB_Netflix
Github pages 주소: https://wlsdudwjd.github.io/PB_Netflix/

## 기술 스택
- Framework: Vue 3 (Composition API), Vite
- Router: Vue Router
- 스타일: CSS 커스텀 스타일, Transitions/Animations
- 데이터: TMDB REST API (이미지/영화 정보), LocalStorage(세션·위시리스트)

## 설치 및 실행
```bash
npm install          # 의존성 설치
npm run dev          # 로컬 개발 서버 (기본 http://localhost:5173)
npm run build        # 프로덕션 빌드
```

### TMDB API 키 설정
- 로그인/회원가입 시 비밀번호 입력란에 TMDB API Key를 저장하는 방식으로 사용합니다.
- 동작을 위해 TMDB API Key가 필요하니 가입 후 발급받아 사용하세요.

## 주요 기능
- 인증: 로그인/회원가입, Remember me, 약관 동의, 미들웨어 라우팅 보호
- 홈: 트렌딩/상영중/인기/평점/개봉예정 섹션 카드 + 히어로 배너
- 대세 콘텐츠: 테이블 뷰(페이지네이션) / 인피니트 스크롤 토글, 찜/상세 이동
- 검색: 제목 입력 + 장르/연도/국가/관람등급 필터, 정렬(인기/평점/개봉일), 실시간 적용
- 상세: 포스터, 메타, 줄거리, 출연/제작진, 추천 영화, 찜 토글
- 위시리스트: 로컬 스토리지 기반 찜 목록, 반응형 카드 그리드

## 폴더 구조
```
pb/
├─ src/
│  ├─ assets/          # 스타일/이미지 리소스
│  ├─ components/      # TopNav, MovieCard, ToastStack 등 공용 컴포넌트
│  ├─ router/          # Vue Router 설정
│  ├─ utils/           # auth(세션), wishlist(로컬 스토리지) 유틸
│  └─ views/           # Home, Popular, Search, SignIn, Detail, Wishlist 뷰
├─ public/             # 정적 리소스
├─ package.json
├─ vite.config.js
└─ README.md
```

## 개발 메모
- 카드 호버 확대, 포스터 클릭 시 상세 이동, 찜 상태 별 배지 표기
- 인피니트 뷰 전용 카드(좌포스터·우텍스트), 테이블 뷰는 그리드 카드
- 반응형 대응(모바일 그리드/패딩/폰트 축소), 기본 애니메이션 적용

## 스크립트
- `npm run dev` : 개발 서버
- `npm run build` : 빌드
- `npm run preview` : 빌드 미리보기 (옵션)
