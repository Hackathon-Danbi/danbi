package com.danbi.domain.practice.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * "나의 금융 독립" 허브 화면 한 번에 조회.
 * 점수·주간 도장·오늘 상태·맞춤 복습 카드를 모두 담는다.
 */
public record PracticeHubResponse(
	int score,
	int maxScore,
	boolean achieved,
	List<String> completedMissionCodes,
	List<WeeklyStamp> weeklyStamps,
	int completedWeekdayCount,
	Today today,
	ReviewDifficulty reviewDifficulty
) {

	/** 이번 주 월~일 각 요일의 도장 상태. */
	public record WeeklyStamp(
		LocalDate date,
		String weekday,
		boolean completed,
		boolean today
	) {
	}

	public record Today(
		LocalDate date,
		boolean quizCompleted,
		boolean practiceCompleted,
		Question question,
		QuizResult quizResult
	) {
	}

	public record Question(
		Long id,
		String text,
		List<String> choices
	) {
	}

	/** 오늘 퀴즈를 이미 푼 경우에만 채워진다. */
	public record QuizResult(
		int selectedIndex,
		int correctIndex,
		boolean correct,
		String explanation
	) {
	}

	/** 노출할 맞춤 복습이 있을 때만 채워진다. */
	public record ReviewDifficulty(
		Long id,
		String step,
		String reason,
		LocalDateTime occurredAt,
		boolean completed
	) {
	}
}
