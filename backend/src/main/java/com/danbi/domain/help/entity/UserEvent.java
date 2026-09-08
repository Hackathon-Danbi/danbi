package com.danbi.domain.help.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 선제적 도움 판단의 근거가 되는 행동 로그. flowSessionId 단위로 집계한다. */
@Entity
@Table(name = "user_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UserEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long eventId;

	@Column(nullable = false)
	private Long userId;

	private Long transferId;

	@Column(nullable = false, length = 36)
	private String flowSessionId;

	// enum 값이 계속 늘어나는 컬럼이라 네이티브 ENUM 대신 VARCHAR 로 저장한다.
	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.VARCHAR)
	@Column(nullable = false, length = 30)
	private FlowType flowType;

	@Column(nullable = false, length = 50)
	private String screenCode;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.VARCHAR)
	@Column(nullable = false, length = 30)
	private EventType eventType;

	/** SMS_*, ID_*, FACE_*, ACCOUNT_PASSWORD_ERROR 등 자유 코드라 문자열로 보관. */
	@Column(length = 50)
	private String reasonCode;

	@Column(length = 255)
	private String eventValue;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.VARCHAR)
	@Column(length = 30)
	private HelpStage helpStage;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.VARCHAR)
	@Column(length = 50)
	private HelpUserResponse userResponse;

	@Column(nullable = false)
	private LocalDateTime createdAt;
}
