package com.danbi.domain.onboarding.entity;

import java.util.Arrays;
import java.util.Optional;

public enum SupportedBank {
	KB_KOOKMIN("004", "KB국민은행", AccountVerificationMethod.ACCOUNT_PASSWORD),
	SHINHAN("088", "신한은행", AccountVerificationMethod.ONE_WON),
	WOORI("020", "우리은행", AccountVerificationMethod.ONE_WON),
	HANA("081", "하나은행", AccountVerificationMethod.ONE_WON),
	NH_NONGHYUP("011", "NH농협은행", AccountVerificationMethod.ONE_WON);

	private final String code;
	private final String displayName;
	private final AccountVerificationMethod verificationMethod;

	SupportedBank(
		String code,
		String displayName,
		AccountVerificationMethod verificationMethod
	) {
		this.code = code;
		this.displayName = displayName;
		this.verificationMethod = verificationMethod;
	}

	public String getCode() {
		return code;
	}

	public String getDisplayName() {
		return displayName;
	}

	public AccountVerificationMethod getVerificationMethod() {
		return verificationMethod;
	}

	public static Optional<SupportedBank> findByCode(String code) {
		return Arrays.stream(values())
			.filter(bank -> bank.code.equals(code))
			.findFirst();
	}
}
