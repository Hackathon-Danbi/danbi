-- 단비 시연영상용 데이터 제거 스크립트.
-- 로컬 MySQL의 danbi DB에서만 실행한다.
-- 실행 후 demo-seed.sql을 다시 실행하면 촬영 시작 상태로 돌아간다.

START TRANSACTION;

SET @demo_user_id = 1;
SET @demo_checking_account_id = 1;
SET @demo_savings_account_id = 1002;
SET @demo_deposit_account_id = 1003;

-- 촬영 중 생성된 도움·연습·송금 데이터까지 사용자 1 기준으로 정리한다.
DELETE FROM user_events
WHERE user_id = @demo_user_id;

DELETE FROM user_mission_progress
WHERE user_id = @demo_user_id;

DELETE FROM daily_activities
WHERE user_id = @demo_user_id;

DELETE FROM auto_transfer_settings
WHERE contract_id IN (1002, 1003)
   OR withdrawal_account_id IN (
       @demo_checking_account_id,
       @demo_savings_account_id,
       @demo_deposit_account_id
   );

DELETE FROM monthly_savings_payments
WHERE contract_id IN (1002, 1003)
   OR transaction_id IN (1001, 1002);

DELETE FROM transfers
WHERE account_id IN (
    @demo_checking_account_id,
    @demo_savings_account_id,
    @demo_deposit_account_id
);

DELETE FROM transactions
WHERE account_id IN (
    @demo_checking_account_id,
    @demo_savings_account_id,
    @demo_deposit_account_id
);

DELETE FROM saved_recipients
WHERE user_id = @demo_user_id;

DELETE FROM savings_contracts
WHERE contract_id IN (1002, 1003)
   OR account_id IN (@demo_savings_account_id, @demo_deposit_account_id);

DELETE FROM accounts
WHERE account_id IN (
    @demo_checking_account_id,
    @demo_savings_account_id,
    @demo_deposit_account_id
);

DELETE FROM account_products
WHERE product_id IN (1001, 1002, 1003);

-- user_term_agreements 는 이전 로컬 스키마에만 있으므로, 존재할 때만 지운다.
SET @demo_has_term_agreements = (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'user_term_agreements'
);
SET @demo_term_agreements_delete_sql = IF(
    @demo_has_term_agreements > 0,
    'DELETE FROM user_term_agreements WHERE user_id = @demo_user_id',
    'DO 0'
);
PREPARE demo_term_agreements_delete FROM @demo_term_agreements_delete_sql;
EXECUTE demo_term_agreements_delete;
DEALLOCATE PREPARE demo_term_agreements_delete;

-- 가입 촬영을 다시 시작할 수 있도록 온보딩 진행 데이터도 비운다.
DELETE FROM one_won_verifications;
DELETE FROM account_verification_targets;
DELETE FROM face_verifications;
DELETE FROM id_card_scans;
DELETE FROM certificate_issuances;
DELETE FROM phone_verification_sessions;
DELETE FROM onboarding_sessions;

DELETE FROM users
WHERE user_id = @demo_user_id;

COMMIT;
