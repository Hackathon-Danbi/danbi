-- 단비 시연영상용 메인 화면 데이터.
-- 로컬 MySQL의 danbi DB에서만 수동 실행한다. 애플리케이션 시작 시 자동 실행되지 않는다.
-- 반복 실행해도 같은 PK를 갱신하도록 작성했다.
-- CLI: mysql ... danbi < demo-seed.sql / Workbench: 아래 USE 로 스키마를 잡는다.
-- SET NAMES: 클라이언트 기본 charset 이 latin1 이어도 한글이 깨지지 않게 강제한다.

SET NAMES utf8mb4;
USE danbi;

SET @demo_user_id = 1;
SET @demo_checking_account_id = 1;
SET @demo_savings_account_id = 1002;
SET @demo_deposit_account_id = 1003;
SET @demo_today = CURRENT_DATE();
SET @demo_pension_at = TIMESTAMP(
    DATE_SUB(@demo_today, INTERVAL LEAST(DAYOFMONTH(@demo_today) - 1, 1) DAY),
    '09:00:00'
);
SET @demo_savings_payment_at = TIMESTAMP(
    DATE_SUB(@demo_today, INTERVAL LEAST(DAYOFMONTH(@demo_today) - 1, 2) DAY),
    '10:00:00'
);

START TRANSACTION;

-- 사용자: 프론트 데모 기본 식별자(userId=1)와 맞춘다.
-- 이전 로컬 스키마에만 있는 onboarding_step 컬럼도 지원한다.
-- simple_password_hash는 123456의 BCrypt 해시다. 실제 송금 비밀번호는 application.properties의 1234를 쓴다.
SET @demo_has_legacy_onboarding_step = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'onboarding_step'
);
SET @demo_user_insert_sql = IF(
    @demo_has_legacy_onboarding_step > 0,
    'INSERT INTO users (user_id, name, onboarding_step, simple_password_hash, identity_verified, certificate_issued, created_at) VALUES (@demo_user_id, ''박옥순'', ''COMPLETED'', ''$2y$10$IguXj94FGbNQyCCqxlY0n.ROhkVTRHyU.Y293qNz8nnMdNKJc07yq'', 1, 1, NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), onboarding_step = VALUES(onboarding_step), simple_password_hash = VALUES(simple_password_hash), identity_verified = VALUES(identity_verified), certificate_issued = VALUES(certificate_issued)',
    'INSERT INTO users (user_id, name, simple_password_hash, identity_verified, certificate_issued, created_at) VALUES (@demo_user_id, ''박옥순'', ''$2y$10$IguXj94FGbNQyCCqxlY0n.ROhkVTRHyU.Y293qNz8nnMdNKJc07yq'', 1, 1, NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), simple_password_hash = VALUES(simple_password_hash), identity_verified = VALUES(identity_verified), certificate_issued = VALUES(certificate_issued)'
);
PREPARE demo_user_insert FROM @demo_user_insert_sql;
EXECUTE demo_user_insert;
DEALLOCATE PREPARE demo_user_insert;

-- 계좌 상품
INSERT INTO account_products (
    product_id,
    product_name,
    product_type,
    base_interest_rate,
    additional_payment_allowed
) VALUES
    (1001, 'KB국민 ONE통장', 'CHECKING', 0.10, 1),
    (1002, 'KB 국민행복적금', 'FIXED_SAVINGS', 3.20, 0),
    (1003, 'KB 국민수퍼정기예금', 'TIME_DEPOSIT', 3.20, 0)
ON DUPLICATE KEY UPDATE
    product_name = VALUES(product_name),
    product_type = VALUES(product_type),
    base_interest_rate = VALUES(base_interest_rate),
    additional_payment_allowed = VALUES(additional_payment_allowed);

-- 대표 입출금 계좌와 예·적금 계좌
-- 이전 로컬 스키마에만 있는 account_password_hash 컬럼도 지원한다.
SET @demo_has_legacy_account_password = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'accounts'
      AND column_name = 'account_password_hash'
);
SET @demo_account_insert_sql = IF(
    @demo_has_legacy_account_password > 0,
    'INSERT INTO accounts (account_id, user_id, product_id, account_name, bank_name, account_number, balance, is_primary, account_status, created_at, account_password_hash) VALUES (@demo_checking_account_id, @demo_user_id, 1001, ''생활비 통장'', ''KB국민은행'', ''123456789012'', 2450000, 1, ''ACTIVE'', NOW(), ''$2y$10$byERsjnBq.okO.YK7eueteZTehGfUaVEQ3HfWUgBLzM6NhCGQ4OuS''), (@demo_savings_account_id, @demo_user_id, 1002, ''행복적금'', ''KB국민은행'', ''234567890123'', 3600000, 0, ''ACTIVE'', NOW(), ''$2y$10$byERsjnBq.okO.YK7eueteZTehGfUaVEQ3HfWUgBLzM6NhCGQ4OuS''), (@demo_deposit_account_id, @demo_user_id, 1003, ''정기예금'', ''KB국민은행'', ''345678901234'', 10000000, 0, ''ACTIVE'', NOW(), ''$2y$10$byERsjnBq.okO.YK7eueteZTehGfUaVEQ3HfWUgBLzM6NhCGQ4OuS'') ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), product_id = VALUES(product_id), account_name = VALUES(account_name), bank_name = VALUES(bank_name), account_number = VALUES(account_number), balance = VALUES(balance), is_primary = VALUES(is_primary), account_status = VALUES(account_status), account_password_hash = VALUES(account_password_hash)',
    'INSERT INTO accounts (account_id, user_id, product_id, account_name, bank_name, account_number, balance, is_primary, account_status, created_at) VALUES (@demo_checking_account_id, @demo_user_id, 1001, ''생활비 통장'', ''KB국민은행'', ''123456789012'', 2450000, 1, ''ACTIVE'', NOW()), (@demo_savings_account_id, @demo_user_id, 1002, ''행복적금'', ''KB국민은행'', ''234567890123'', 3600000, 0, ''ACTIVE'', NOW()), (@demo_deposit_account_id, @demo_user_id, 1003, ''정기예금'', ''KB국민은행'', ''345678901234'', 10000000, 0, ''ACTIVE'', NOW()) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), product_id = VALUES(product_id), account_name = VALUES(account_name), bank_name = VALUES(bank_name), account_number = VALUES(account_number), balance = VALUES(balance), is_primary = VALUES(is_primary), account_status = VALUES(account_status)'
);
PREPARE demo_account_insert FROM @demo_account_insert_sql;
EXECUTE demo_account_insert;
DEALLOCATE PREPARE demo_account_insert;

-- 예·적금 계약
INSERT INTO savings_contracts (
    contract_id,
    account_id,
    applied_interest_rate,
    monthly_payment_amount,
    opened_at,
    maturity_at,
    expected_maturity_amount,
    contract_status
) VALUES
    (1002, @demo_savings_account_id, 3.20, 300000, DATE_SUB(@demo_today, INTERVAL 1 MONTH), DATE_ADD(@demo_today, INTERVAL 11 MONTH), 7120000, 'ACTIVE'),
    (1003, @demo_deposit_account_id, 3.20, NULL, DATE_SUB(@demo_today, INTERVAL 7 MONTH), DATE_ADD(@demo_today, INTERVAL 5 MONTH), 10134000, 'ACTIVE')
ON DUPLICATE KEY UPDATE
    account_id = VALUES(account_id),
    applied_interest_rate = VALUES(applied_interest_rate),
    monthly_payment_amount = VALUES(monthly_payment_amount),
    opened_at = VALUES(opened_at),
    maturity_at = VALUES(maturity_at),
    expected_maturity_amount = VALUES(expected_maturity_amount),
    contract_status = VALUES(contract_status);

INSERT INTO auto_transfer_settings (
    auto_transfer_id,
    contract_id,
    withdrawal_account_id,
    transfer_day,
    transfer_amount,
    enabled
) VALUES (
    1002,
    1002,
    @demo_checking_account_id,
    25,
    300000,
    1
)
ON DUPLICATE KEY UPDATE
    withdrawal_account_id = VALUES(withdrawal_account_id),
    transfer_day = VALUES(transfer_day),
    transfer_amount = VALUES(transfer_amount),
    enabled = VALUES(enabled);

-- 오랜만에 접속했을 때 보여줄 미확인 거래 2건
INSERT INTO transactions (
    transaction_id,
    account_id,
    transaction_type,
    payment_method,
    description,
    amount,
    occurred_at,
    review_status,
    reviewed_at
) VALUES
    (1001, @demo_checking_account_id, 'DEPOSIT', 'TRANSFER', '국민연금 입금', 650000, @demo_pension_at, 'PENDING', NULL),
    (1002, @demo_checking_account_id, 'WITHDRAWAL', 'AUTO_TRANSFER', 'KB 국민행복적금 자동납입', 300000, @demo_savings_payment_at, 'PENDING', NULL)
ON DUPLICATE KEY UPDATE
    account_id = VALUES(account_id),
    transaction_type = VALUES(transaction_type),
    payment_method = VALUES(payment_method),
    description = VALUES(description),
    amount = VALUES(amount),
    occurred_at = VALUES(occurred_at),
    review_status = VALUES(review_status),
    reviewed_at = VALUES(reviewed_at);

-- 이번 달 적금 자동납입. 연결 거래를 먼저 만든 뒤 납입 행을 넣는다.
INSERT INTO monthly_savings_payments (
    monthly_payment_id,
    contract_id,
    transaction_id,
    payment_month,
    due_date,
    scheduled_amount,
    amount,
    status,
    paid_at
) VALUES (
    1002,
    1002,
    1002,
    DATE_FORMAT(@demo_today, '%Y-%m'),
    DATE(@demo_savings_payment_at),
    300000,
    300000,
    'PAID',
    @demo_savings_payment_at
)
ON DUPLICATE KEY UPDATE
    transaction_id = VALUES(transaction_id),
    payment_month = VALUES(payment_month),
    due_date = VALUES(due_date),
    scheduled_amount = VALUES(scheduled_amount),
    amount = VALUES(amount),
    status = VALUES(status),
    paid_at = VALUES(paid_at);

-- 음성 송금 대상: "딸한테 5만 원 보내줘"에서 별칭 '딸'로 찾는다.
INSERT INTO saved_recipients (
    saved_recipient_id,
    user_id,
    recipient_bank_code,
    recipient_account_number,
    recipient_name,
    nickname
) VALUES (
    1001,
    @demo_user_id,
    '088',
    '110234567890',
    '김서연',
    '딸'
)
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    recipient_bank_code = VALUES(recipient_bank_code),
    recipient_account_number = VALUES(recipient_account_number),
    recipient_name = VALUES(recipient_name),
    nickname = VALUES(nickname);

-- 딸 계좌는 과거 완료 이력이 있어 정상 송금으로 판단한다.
INSERT INTO transfers (
    transfer_id,
    account_id,
    saved_recipient_id,
    recipient_bank_code,
    recipient_account_number,
    recipient_name,
    amount,
    transfer_method,
    recipient_is_new,
    status,
    requested_at,
    completed_at,
    is_in_call,
    is_risky
) VALUES
    (1001, @demo_checking_account_id, 1001, '088', '110234567890', '김서연', 80000, 'VOICE', 0, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), 0, 0),
    (1002, @demo_checking_account_id, NULL, '004', '987654321098', '김영희', 100000, 'MANUAL', 1, 'FAILED', DATE_SUB(NOW(), INTERVAL 30 DAY), NULL, 0, 0)
ON DUPLICATE KEY UPDATE
    account_id = VALUES(account_id),
    saved_recipient_id = VALUES(saved_recipient_id),
    recipient_bank_code = VALUES(recipient_bank_code),
    recipient_account_number = VALUES(recipient_account_number),
    recipient_name = VALUES(recipient_name),
    amount = VALUES(amount),
    transfer_method = VALUES(transfer_method),
    recipient_is_new = VALUES(recipient_is_new),
    status = VALUES(status),
    requested_at = VALUES(requested_at),
    completed_at = VALUES(completed_at),
    is_in_call = VALUES(is_in_call),
    is_risky = VALUES(is_risky);

COMMIT;

-- 실행 직후 간단 확인
SELECT user_id, name FROM users WHERE user_id = @demo_user_id;
SELECT account_id, account_name, balance FROM accounts WHERE user_id = @demo_user_id ORDER BY account_id;
SELECT transaction_id, description, amount, review_status FROM transactions WHERE account_id = @demo_checking_account_id ORDER BY occurred_at DESC;
SELECT saved_recipient_id, recipient_name, nickname FROM saved_recipients WHERE user_id = @demo_user_id;
