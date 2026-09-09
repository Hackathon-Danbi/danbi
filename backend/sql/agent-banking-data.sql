-- Run manually against MySQL after the existing schema has been created.
-- Set these IDs to the same AGENT_USER_ID / AGENT_ACCOUNT_ID used by the backend.
-- Existing rows (including balance) are preserved. No automatic application initialization.
SET @agent_user_id = 1;
SET @agent_account_id = 1;
SET @agent_product_id = 1;
START TRANSACTION;

INSERT INTO users(user_id,name,simple_password_hash,identity_verified,certificate_issued,created_at)
SELECT @agent_user_id,'단비 사용자','!disabled',false,false,CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE user_id=@agent_user_id);

INSERT INTO account_products(product_id,product_name,product_type,base_interest_rate,additional_payment_allowed)
SELECT @agent_product_id,'입출금 통장','CHECKING',0,false
WHERE NOT EXISTS (SELECT 1 FROM account_products WHERE product_id=@agent_product_id);

INSERT INTO accounts(account_id,user_id,product_id,account_name,bank_name,account_number,balance,is_primary,account_status,created_at)
SELECT @agent_account_id,@agent_user_id,@agent_product_id,'단비 입출금','KB국민은행',
CONCAT('11000000',LPAD(@agent_account_id,4,'0')),150000,true,'ACTIVE',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE account_id=@agent_account_id);

INSERT INTO saved_recipients(user_id,recipient_bank_code,recipient_account_number,recipient_name,nickname)
SELECT @agent_user_id,'004',d.account_number,d.name,d.alias
FROM (
 SELECT '900000001234' AS account_number,'김민수' AS name,'민수' AS alias
 UNION ALL SELECT '900000005678','이지영','지영'
 UNION ALL SELECT '900000001111','박영희','영희'
 UNION ALL SELECT '900000002222','김영희','영희'
) d
WHERE EXISTS (SELECT 1 FROM accounts WHERE account_id=@agent_account_id AND user_id=@agent_user_id)
AND NOT EXISTS (SELECT 1 FROM saved_recipients r WHERE r.user_id=@agent_user_id
 AND r.recipient_bank_code='004' AND r.recipient_account_number=d.account_number);

INSERT INTO transactions(account_id,transaction_type,description,amount,occurred_at,review_status)
SELECT @agent_account_id,d.kind,d.description,d.amount,DATE_SUB(CURRENT_DATE,INTERVAL d.days_ago DAY),'PENDING'
FROM (
 SELECT 'WITHDRAWAL' AS kind,'연습 마트' AS description,12000 AS amount,1 AS days_ago
 UNION ALL SELECT 'DEPOSIT','연습 입금',50000,3
) d
WHERE EXISTS (SELECT 1 FROM accounts WHERE account_id=@agent_account_id AND user_id=@agent_user_id)
AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.account_id=@agent_account_id
 AND t.transaction_type=d.kind AND t.description=d.description AND t.amount=d.amount);
COMMIT;

SELECT account_id,user_id,balance FROM accounts WHERE account_id=@agent_account_id AND user_id=@agent_user_id;
SELECT saved_recipient_id,recipient_name,nickname FROM saved_recipients WHERE user_id=@agent_user_id;
SELECT transaction_id,transaction_type,amount,occurred_at FROM transactions WHERE account_id=@agent_account_id;
