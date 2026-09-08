package com.danbi.domain.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "user_id")
	private Long userId;

	@Column(name = "name", length = 50, nullable = false)
	private String name;

	@Column(name = "simple_password_hash", length = 255, nullable = false)
	private String simplePasswordHash;

	@Column(name = "identity_verified", nullable = false)
	private boolean identityVerified;

	@Column(name = "certificate_issued", nullable = false)
	private boolean certificateIssued;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	private User(
		String name,
		String simplePasswordHash,
		boolean identityVerified,
		boolean certificateIssued,
		Instant createdAt
	) {
		this.name = name;
		this.simplePasswordHash = simplePasswordHash;
		this.identityVerified = identityVerified;
		this.certificateIssued = certificateIssued;
		this.createdAt = createdAt;
	}

	public static User completeRegistration(
		String name,
		String simplePasswordHash,
		Instant createdAt
	) {
		return new User(
			name,
			simplePasswordHash,
			true,
			true,
			createdAt
		);
	}

	@PrePersist
	private void initializeCreatedAt() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}
}
