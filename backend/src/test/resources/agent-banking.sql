INSERT INTO users(user_id,name,simple_password_hash,identity_verified,certificate_issued,created_at)
VALUES(1,'테스트 사용자','!disabled',false,false,'2026-09-08 00:00:00');
INSERT INTO account_products(product_id,product_name,product_type,base_interest_rate,additional_payment_allowed)
VALUES(1,'입출금','CHECKING',0,false);
INSERT INTO accounts(account_id,user_id,product_id,account_name,bank_name,account_number,balance,is_primary,account_status,created_at)
VALUES(1,1,1,'입출금 계좌','KB국민은행','110000001000',150000,true,'ACTIVE','2026-09-08 00:00:00');
INSERT INTO saved_recipients(saved_recipient_id,user_id,recipient_bank_code,recipient_account_number,recipient_name,nickname)
VALUES(1,1,'004','900000001234','김민수','민수'),
(2,1,'004','900000005678','이지영','지영'),
(3,1,'004','900000001111','박영희','영희'),
(4,1,'004','900000002222','김영희','영희');
INSERT INTO transactions(account_id,transaction_type,description,amount,occurred_at,review_status)
VALUES(1,'WITHDRAWAL','연습 마트',12000,'2026-09-07 00:00:00','PENDING'),
(1,'DEPOSIT','연습 입금',50000,'2026-09-05 00:00:00','PENDING');
