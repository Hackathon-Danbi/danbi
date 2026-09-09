package com.danbi.domain.practice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

/**
 * 사용자 하루치 금융활동. (user_id, activity_date) 당 한 행.
 * 퀴즈 응답과 연습 완료가 같은 행에 채워지고, 둘 다 채워지면 "이번 주 안심 도장" 하나로 집계된다.
 *
 * <p>ERD와 달리 question_id / mission_id 를 nullable 로 둔다. 퀴즈만 먼저 하거나
 * 연습만 먼저 하는 순서를 그대로 담기 위함이다.
 */
@Entity
@Table(
	name = "daily_activities",
	uniqueConstraints = @UniqueConstraint(
		name = "UK_DAILY_ACTIVITIES_USER_DATE",
		columnNames = {"user_id", "activity_date"}
	)
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyActivity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "daily_activity_id")
	private Long dailyActivityId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "activity_date", nullable = false)
	private LocalDate activityDate;

	@Column(name = "question_id")
	private Long questionId;

	@Column(name = "mission_id")
	private Long missionId;

	/** 사용자가 고른 답. true = O, false = X, null = 아직 안 풂. */
	@Column(name = "selected_answer")
	private Boolean selectedAnswer;

	@ColumnDefault("false")
	@Column(name = "practice_completed", nullable = false)
	private boolean practiceCompleted;

	@ColumnDefault("0")
	@Column(name = "earned_score", nullable = false)
	private int earnedScore;

	private DailyActivity(Long userId, LocalDate activityDate) {
		this.userId = userId;
		this.activityDate = activityDate;
		this.practiceCompleted = false;
		this.earnedScore = 0;
	}

	public static DailyActivity start(Long userId, LocalDate activityDate) {
		return new DailyActivity(userId, activityDate);
	}

	public boolean isQuizAnswered() {
		return selectedAnswer != null;
	}

	/** 이번 주 안심 도장 획득 조건: 퀴즈 + 연습 모두 완료. */
	public boolean isDayCompleted() {
		return isQuizAnswered() && practiceCompleted;
	}

	/** 하루 한 번만 반영. 이미 풀었으면 무시하고 false 반환. */
	public boolean answerQuiz(Long questionId, boolean selectedAnswer) {
		if (isQuizAnswered()) {
			return false;
		}
		this.questionId = questionId;
		this.selectedAnswer = selectedAnswer;
		return true;
	}

	/** 하루 한 번만 반영. 이미 완료했으면 무시하고 false 반환. */
	public boolean completePractice(Long missionId, int earnedScore) {
		if (practiceCompleted) {
			return false;
		}
		this.missionId = missionId;
		this.practiceCompleted = true;
		this.earnedScore += Math.max(earnedScore, 0);
		return true;
	}
}
