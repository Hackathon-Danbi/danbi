package com.danbi.practice;

import static org.assertj.core.api.Assertions.assertThat;

import com.danbi.domain.practice.dto.CompletePracticeRequest;
import com.danbi.domain.practice.dto.PracticeCompletionResult;
import com.danbi.domain.practice.dto.PracticeMissionResponse;
import com.danbi.domain.practice.dto.QuizAnswerRequest;
import com.danbi.domain.practice.dto.QuizAnswerResult;
import com.danbi.domain.practice.dto.TodayDailyActivityResponse;
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
	void today_freshUser_createsActivityWithQuestionAndTransferMission() {
		TodayDailyActivityResponse today = practiceService.getToday(USER_ID);

		assertThat(today.dailyActivityId()).isNotNull();
		assertThat(today.activityDate()).isEqualTo("2026-09-09");
		assertThat(today.question().questionId()).isNotNull();
		assertThat(today.question().questionText()).isNotBlank();
		assertThat(today.question().selectedAnswer()).isNull();
		assertThat(today.mission().missionType()).isEqualTo("TRANSFER");
		assertThat(today.mission().scoreReward()).isPositive();
		assertThat(today.practiceCompleted()).isFalse();
		assertThat(today.earnedScore()).isZero();
	}

	@Test
	void today_isIdempotent_returnsSameActivityId() {
		Long first = practiceService.getToday(USER_ID).dailyActivityId();
		Long second = practiceService.getToday(USER_ID).dailyActivityId();

		assertThat(second).isEqualTo(first);
	}

	@Test
	void answerQuiz_reportsCorrectness_andKeepsFirstAnswer() {
		Long dailyActivityId = practiceService.getToday(USER_ID).dailyActivityId();

		QuizAnswerResult first = practiceService.answerQuiz(dailyActivityId, new QuizAnswerRequest(true));
		QuizAnswerResult second = practiceService.answerQuiz(dailyActivityId, new QuizAnswerRequest(false));

		assertThat(first.correct()).isEqualTo(first.selectedAnswer() == first.correctAnswer());
		assertThat(first.explanation()).isNotBlank();
		// 두 번째 응답은 무시되고 첫 응답(true)이 유지된다.
		assertThat(second.selectedAnswer()).isTrue();
		assertThat(second.correct()).isEqualTo(first.correct());

		assertThat(practiceService.getToday(USER_ID).question().selectedAnswer()).isTrue();
	}

	@Test
	void completePractice_marksCompleted_andAccumulatesScoreOnce() {
		TodayDailyActivityResponse today = practiceService.getToday(USER_ID);
		Long missionId = today.mission().missionId();
		int reward = today.mission().scoreReward();

		PracticeCompletionResult first = practiceService.completePractice(
			today.dailyActivityId(), new CompletePracticeRequest(missionId, true));
		PracticeCompletionResult again = practiceService.completePractice(
			today.dailyActivityId(), new CompletePracticeRequest(missionId, true));

		assertThat(first.practiceCompleted()).isTrue();
		assertThat(first.earnedScore()).isEqualTo(reward);
		// 미션당 최초 1회만 가산 → 재호출해도 점수 그대로.
		assertThat(again.earnedScore()).isEqualTo(reward);
		assertThat(practiceService.getToday(USER_ID).practiceCompleted()).isTrue();
	}

	@Test
	void completePractice_unknownActivity_is404() {
		try {
			practiceService.completePractice(999_999L, new CompletePracticeRequest(1L, true));
			assertThat(false).as("expected 404").isTrue();
		} catch (org.springframework.web.server.ResponseStatusException e) {
			assertThat(e.getStatusCode().value()).isEqualTo(404);
		}
	}

	@Test
	void listTransferMissions_returnsOnlyTransferType() {
		var missions = practiceService.listTransferMissions().missions();

		assertThat(missions).isNotEmpty();
		assertThat(missions).allSatisfy(m -> assertThat(m.missionType()).isEqualTo("TRANSFER"));
		assertThat(missions).extracting(PracticeMissionResponse::title).doesNotContainNull();
	}
}
