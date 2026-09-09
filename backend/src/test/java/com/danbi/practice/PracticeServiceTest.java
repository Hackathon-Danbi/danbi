package com.danbi.practice;

import static org.assertj.core.api.Assertions.assertThat;

import com.danbi.domain.practice.dto.MissionCompletionRequest;
import com.danbi.domain.practice.dto.MissionCompletionResponse;
import com.danbi.domain.practice.dto.PracticeHubResponse;
import com.danbi.domain.practice.dto.QuizAnswerRequest;
import com.danbi.domain.practice.dto.QuizAnswerResponse;
import com.danbi.domain.practice.dto.TransferDifficultyRequest;
import com.danbi.domain.practice.dto.TransferDifficultyResponse;
import com.danbi.domain.practice.entity.TransferDifficultyReason;
import com.danbi.domain.practice.entity.TransferDifficultyStep;
import com.danbi.domain.practice.service.PracticeService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
@Import(PracticeServiceTest.FixedClockConfig.class)
class PracticeServiceTest {

	private static final long USER_ID = 9001L;
	/** KST 2026-09-09(수) 10:00 고정. */
	private static final LocalDate TODAY = LocalDate.of(2026, 9, 9);

	@Autowired
	private PracticeService practiceService;

	@TestConfiguration
	static class FixedClockConfig {
		@Bean
		@Primary
		Clock fixedClock() {
			return Clock.fixed(Instant.parse("2026-09-09T01:00:00Z"), ZoneId.of("Asia/Seoul"));
		}
	}

	@Test
	void hub_freshUser_hasZeroScoreAndSevenEmptyStamps() {
		PracticeHubResponse hub = practiceService.getHub(USER_ID);

		assertThat(hub.score()).isZero();
		assertThat(hub.maxScore()).isEqualTo(100);
		assertThat(hub.achieved()).isFalse();
		assertThat(hub.completedMissionCodes()).isEmpty();
		assertThat(hub.weeklyStamps()).hasSize(7);
		assertThat(hub.weeklyStamps()).noneMatch(PracticeHubResponse.WeeklyStamp::completed);
		assertThat(hub.completedWeekdayCount()).isZero();
		assertThat(hub.today().date()).isEqualTo(TODAY);
		assertThat(hub.today().quizCompleted()).isFalse();
		assertThat(hub.today().question()).isNotNull();
		assertThat(hub.today().question().choices()).containsExactly("O", "X");
		assertThat(hub.today().quizResult()).isNull();
		assertThat(hub.reviewDifficulty()).isNull();
	}

	@Test
	void quizPlusMission_sameDay_earnsStampAndScore() {
		Long questionId = practiceService.getHub(USER_ID).today().question().id();

		practiceService.answerQuiz(USER_ID, new QuizAnswerRequest(questionId, 0, null));
		MissionCompletionResponse completion = practiceService.completeMission(
			USER_ID, new MissionCompletionRequest("guided-transfer", null));

		assertThat(completion.firstCompletion()).isTrue();
		assertThat(completion.earnedPoints()).isEqualTo(10);
		assertThat(completion.totalScore()).isEqualTo(10);
		assertThat(completion.dayCompleted()).isTrue();

		PracticeHubResponse hub = practiceService.getHub(USER_ID);
		assertThat(hub.score()).isEqualTo(10);
		assertThat(hub.completedMissionCodes()).containsExactly("guided-transfer");
		assertThat(hub.completedWeekdayCount()).isEqualTo(1);
		PracticeHubResponse.WeeklyStamp todayStamp = hub.weeklyStamps().stream()
			.filter(PracticeHubResponse.WeeklyStamp::today)
			.findFirst()
			.orElseThrow();
		assertThat(todayStamp.completed()).isTrue();
		assertThat(todayStamp.weekday()).isEqualTo("WEDNESDAY");
		assertThat(hub.today().quizCompleted()).isTrue();
		assertThat(hub.today().quizResult()).isNotNull();
	}

	@Test
	void answerQuiz_isIdempotentPerDay() {
		Long questionId = practiceService.getHub(USER_ID).today().question().id();

		QuizAnswerResponse first = practiceService.answerQuiz(
			USER_ID, new QuizAnswerRequest(questionId, 0, null));
		QuizAnswerResponse second = practiceService.answerQuiz(
			USER_ID, new QuizAnswerRequest(questionId, 1, null));

		assertThat(first.alreadyAnswered()).isFalse();
		assertThat(second.alreadyAnswered()).isTrue();
		// 첫 응답(index 0)이 유지되어야 한다.
		assertThat(second.correct()).isEqualTo(first.correct());
	}

	@Test
	void completeMission_scoresOnlyOnFirstCompletion() {
		practiceService.completeMission(USER_ID, new MissionCompletionRequest("solo-transfer", null));
		MissionCompletionResponse again = practiceService.completeMission(
			USER_ID, new MissionCompletionRequest("solo-transfer", null));

		assertThat(again.firstCompletion()).isFalse();
		assertThat(again.earnedPoints()).isZero();
		assertThat(again.totalScore()).isEqualTo(20);
		assertThat(again.practiceAlreadyCompletedToday()).isTrue();
	}

	@Test
	void reviewableDifficulty_surfacesInHub_andCanBeCompleted() {
		TransferDifficultyResponse recorded = practiceService.recordDifficulty(
			USER_ID,
			new TransferDifficultyRequest(TransferDifficultyStep.ACCOUNT, TransferDifficultyReason.INPUT_ERROR, 12L, null));

		PracticeHubResponse hub = practiceService.getHub(USER_ID);
		assertThat(hub.reviewDifficulty()).isNotNull();
		assertThat(hub.reviewDifficulty().step()).isEqualTo("account");
		assertThat(hub.reviewDifficulty().reason()).isEqualTo("inputError");
		assertThat(hub.reviewDifficulty().completed()).isFalse();

		TransferDifficultyResponse completed = practiceService.completeDifficulty(
			USER_ID, recorded.id(), true);
		assertThat(completed.completed()).isTrue();
		assertThat(completed.completedAt()).isNotNull();
	}

	@Test
	void nonReviewableDifficulty_notSurfacedInHub() {
		practiceService.recordDifficulty(
			USER_ID,
			new TransferDifficultyRequest(TransferDifficultyStep.PASSWORD, null, null, null));

		assertThat(practiceService.getHub(USER_ID).reviewDifficulty()).isNull();
	}
}
