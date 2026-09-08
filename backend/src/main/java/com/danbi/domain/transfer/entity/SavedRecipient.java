package com.danbi.domain.transfer.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 저장한 수취인(자주 쓰는 계좌). */
@Entity
@Table(name = "saved_recipients")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class SavedRecipient {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long savedRecipientId;

	@Column(nullable = false)
	private Long userId;

	@Column(nullable = false, length = 10)
	private String recipientBankCode;

	@Column(nullable = false, length = 30)
	private String recipientAccountNumber;

	@Column(nullable = false, length = 50)
	private String recipientName;

	@Column(length = 50)
	private String nickname;

	/** 같은 계좌를 다시 저장할 때 이름/별칭만 갱신한다. */
	public void updateLabels(String recipientName, String nickname) {
		if (recipientName != null && !recipientName.isBlank()) {
			this.recipientName = recipientName;
		}
		this.nickname = nickname;
	}
}
