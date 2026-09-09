package com.danbi.domain.transfer.entity;

/** 송금 은행 선택(BANK_SELECT 화면)용 은행 목록. code 는 표준 은행 코드. */
public enum Bank {

	KB_KOOKMIN("004", "KB국민은행"),
	SHINHAN("088", "신한은행"),
	WOORI("020", "우리은행"),
	HANA("081", "하나은행"),
	NH_NONGHYUP("011", "NH농협은행"),
	IBK_GIUP("003", "IBK기업은행"),
	SC_JEIL("023", "SC제일은행"),
	KAKAO_BANK("090", "카카오뱅크"),
	TOSS_BANK("092", "토스뱅크"),
	K_BANK("089", "케이뱅크"),
	POST_OFFICE("071", "우체국예금"),
	SAEMAEUL("045", "새마을금고"),
	SHINHYEOP("048", "신협"),
	BUSAN("032", "부산은행"),
	IM_BANK("031", "iM뱅크(대구)");

	private final String code;
	private final String name;

	Bank(String code, String name) {
		this.code = code;
		this.name = name;
	}

	public String getCode() {
		return code;
	}

	public String getName() {
		return name;
	}
}
