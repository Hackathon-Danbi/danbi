# 시연영상용 DB 데이터

이 폴더의 SQL은 로컬 MySQL `danbi` 데이터베이스에서만 수동 실행한다.
Spring Boot 시작 시 자동 실행되지 않는다.

## 최초 입력

Hibernate가 테이블을 만들도록 백엔드를 한 번 실행한 다음 아래 명령을 실행한다.

```bash
mysql -h 127.0.0.1 -P 3306 -u danbi -p danbi \
  < src/main/resources/db/demo-seed.sql
```

비밀번호는 로컬 기본값 `danbi_local_pw`다.

## 촬영 상태로 되돌리기

```bash
mysql -h 127.0.0.1 -P 3306 -u danbi -p danbi \
  < src/main/resources/db/demo-reset.sql

mysql -h 127.0.0.1 -P 3306 -u danbi -p danbi \
  < src/main/resources/db/demo-seed.sql
```

`demo-reset.sql`은 `user_id=1`과 시연용 고정 계좌 ID의 데이터를 제거한다.
팀 공용 DB나 운영 DB에서는 실행하지 않는다.

가입 동행 장면은 사용자 정보가 없는 상태가 필요하므로 `demo-reset.sql` 실행 직후 촬영한다.
거래·송금·예적금 장면은 이어서 `demo-seed.sql`을 실행한 뒤 촬영한다.

프론트의 온보딩 완료, 거래 확인, 미션 점수와 어려웠던 송금 단계는 AsyncStorage에 저장되므로
DB SQL과 별도로 프론트 저장소를 초기화해야 한다.
