package com.danbi.domain.practice.service;

import com.danbi.domain.practice.dto.MissionCompletionRequest;
import com.danbi.domain.practice.dto.MissionCompletionResponse;
import com.danbi.domain.practice.dto.PracticeHubResponse;
import com.danbi.domain.practice.dto.QuizAnswerRequest;
import com.danbi.domain.practice.dto.QuizAnswerResponse;
import com.danbi.domain.practice.dto.TransferDifficultyRequest;
import com.danbi.domain.practice.dto.TransferDifficultyResponse;
import com.danbi.domain.practice.entity.DailyActivity;
import com.danbi.domain.practice.entity.FinancialQuestion;
import com.danbi.domain.practice.entity.PracticeMission;
import com.danbi.domain.practice.entity.TransferDifficulty;
import com.danbi.domain.practice.entity.UserMissionProgress;
import com.danbi.domain.practice.repository.DailyActivityRepository;
import com.danbi.domain.practice.repository.FinancialQuestionRepository;
import com.danbi.domain.practice.repository.PracticeMissionRepository;
import com.danbi.domain.practice.repository.TransferDifficultyRepository;
import com.danbi.domain.practice.repository.UserMissionProgressRepository;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeService {

	private static final List<String> OX_CHOICES = List.of("O", "X");

	private final PracticeMissionRepository missionRepository;
	private final FinancialQuestionRepository questionRepository;
	private final UserMissionProgressRepository progressRepository;
	private final DailyActivityRepository dailyActivityRepository;
	private final TransferDifficultyRepository transferDifficultyRepository;
	private final Clock clock;

	/** "나의 금융 독립" 허브 화면 조회. */
	public PracticeHubResponse getHub(Long userId) {
		List<PracticeMission> catalog = missionRepository.findAll();
		Map<Long, Integer> pointsByMissionId = catalog.stream()
			.collect(Collectors.toMap(PracticeMission::getMissionId, PracticeMission::getScoreReward));
		Map<Long, String> codeByMissionId = catalog.stream()
			.collect(Collectors.toMap(PracticeMission::getMissionId, PracticeMission::getCode));

		int maxScore = catalog.stream().mapToInt(PracticeMission::getScoreReward).sum();
		List<UserMissionProgress> completedProgress = progressRepository.findByUserIdAndCompletedTrue(userId);
		int score = Math.min(
			maxScore,
			completedProgress.stream()
				.mapToInt(progress -> pointsByMissionId.getOrDefault(progress.getMissionId(), 0))
				.sum()
		);
		List<String> completedMissionCodes = completedProgress.stream()
			.map(progress -> codeByMissionId.get(progress.getMissionId()))
			.filter(java.util.Objects::nonNull)
			.sorted()
			.toList();

		LocalDate today = LocalDate.now(clock);
		LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
		LocalDate sunday = monday.plusDays(6);
		Map<LocalDate, DailyActivity> activityByDate = dailyActivityRepository
			.findByUserIdAndActivityDateBetween(userId, monday, sunday)
			.stream()
			.collect(Collectors.toMap(DailyActivity::getActivityDate, Function.identity()));

		List<PracticeHubResponse.WeeklyStamp> weeklyStamps = new ArrayList<>();
		for (int i = 0; i < 7; i++) {
			LocalDate day = monday.plusDays(i);
			DailyActivity activity = activityByDate.get(day);
			weeklyStamps.add(new PracticeHubResponse.WeeklyStamp(
				day,
				day.getDayOfWeek().name(),
				activity != null && activity.isDayCompleted(),
				day.equals(today)
			));
		}
		int completedWeekdayCount = (int) weeklyStamps.stream()
			.filter(PracticeHubResponse.WeeklyStamp::completed)
			.count();

		DailyActivity todayActivity = activityByDate.get(today);
		PracticeHubResponse.Today todaySection = buildToday(userId, today, todayActivity);
		PracticeHubResponse.ReviewDifficulty reviewDifficulty = pickReviewDifficulty(userId);

		return new PracticeHubResponse(
			score,
			maxScore,
			maxScore > 0 && score >= maxScore,
			completedMissionCodes,
			weeklyStamps,
			completedWeekdayCount,
			todaySection,
			reviewDifficulty
		);
	}

	/** 오늘의 금융 한 문제 응답 저장. 하루 1회, 멱등. */
	@Transactional
	public QuizAnswerResponse answerQuiz(Long userId, QuizAnswerRequest request) {
		LocalDate date = request.date() != null ? request.date() : LocalDate.now(clock);
		FinancialQuestion question = questionRepository.findById(request.questionId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "문제를 찾을 수 없습니다."));

		DailyActivity activity = dailyActivityRepository.findByUserIdAndActivityDate(userId, date)
			.orElseGet(() -> DailyActivity.start(userId, date));
		boolean applied = activity.answerQuiz(question.getQuestionId(), request.answeredIndex() == 0);
		dailyActivityRepository.save(activity);

		int storedIndex = Boolean.TRUE.equals(activity.getSelectedAnswer()) ? 0 : 1;
		return new QuizAnswerResponse(
			question.isCorrect(storedIndex),
			question.correctIndex(),
			question.getExplanation(),
			!applied,
			activity.isDayCompleted()
		);
	}

	/** 금융 연습(미션) 완료 저장. 점수는 미션당 최초 1회만. */
	@Transactional
	public MissionCompletionResponse completeMission(Long userId, MissionCompletionRequest request) {
		LocalDate date = request.date() != null ? request.date() : LocalDate.now(clock);
		PracticeMission mission = missionRepository.findByCode(request.missionCode())
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND, "연습을 찾을 수 없습니다: " + request.missionCode()));

		UserMissionProgress progress = progressRepository
			.findByUserIdAndMissionId(userId, mission.getMissionId())
			.orElseGet(() -> UserMissionProgress.of(userId, mission.getMissionId()));
		boolean firstCompletion = progress.markCompleted(clock);
		progressRepository.save(progress);
		int earnedPoints = firstCompletion ? mission.getScoreReward() : 0;

		DailyActivity activity = dailyActivityRepository.findByUserIdAndActivityDate(userId, date)
			.orElseGet(() -> DailyActivity.start(userId, date));
		boolean practiceAlreadyCompletedToday = activity.isPracticeCompleted();
		activity.completePractice(mission.getMissionId(), mission.getScoreReward());
		dailyActivityRepository.save(activity);

		List<PracticeMission> catalog = missionRepository.findAll();
		int maxScore = catalog.stream().mapToInt(PracticeMission::getScoreReward).sum();
		int totalScore = totalScore(catalog, userId, maxScore);

		return new MissionCompletionResponse(
			earnedPoints,
			totalScore,
			maxScore,
			firstCompletion,
			practiceAlreadyCompletedToday,
			activity.isDayCompleted()
		);
	}

	/** 실제 송금에서 사용자가 막힌 지점 적재. */
	@Transactional
	public TransferDifficultyResponse recordDifficulty(Long userId, TransferDifficultyRequest request) {
		LocalDateTime occurredAt = request.occurredAt() != null
			? request.occurredAt()
			: LocalDateTime.now(clock);
		TransferDifficulty saved = transferDifficultyRepository.save(TransferDifficulty.of(
			userId,
			request.transferId(),
			request.step(),
			request.reason(),
			occurredAt
		));
		return TransferDifficultyResponse.from(saved);
	}

	public List<TransferDifficultyResponse> listDifficulties(Long userId) {
		return transferDifficultyRepository.findByUserIdOrderByOccurredAtDesc(userId).stream()
			.map(TransferDifficultyResponse::from)
			.toList();
	}

	/** 맞춤 복습 완료 처리. */
	@Transactional
	public TransferDifficultyResponse completeDifficulty(Long userId, Long difficultyId, boolean completed) {
		TransferDifficulty difficulty = transferDifficultyRepository
			.findByDifficultyIdAndUserId(difficultyId, userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "복습 항목을 찾을 수 없습니다."));
		if (completed) {
			difficulty.markCompleted(clock);
			transferDifficultyRepository.save(difficulty);
		}
		return TransferDifficultyResponse.from(difficulty);
	}

	private int totalScore(List<PracticeMission> catalog, Long userId, int maxScore) {
		Map<Long, Integer> pointsByMissionId = catalog.stream()
			.collect(Collectors.toMap(PracticeMission::getMissionId, PracticeMission::getScoreReward));
		int raw = progressRepository.findByUserIdAndCompletedTrue(userId).stream()
			.mapToInt(progress -> pointsByMissionId.getOrDefault(progress.getMissionId(), 0))
			.sum();
		return Math.min(raw, maxScore);
	}

	private PracticeHubResponse.Today buildToday(Long userId, LocalDate today, DailyActivity todayActivity) {
		List<FinancialQuestion> questions = questionRepository.findAllByOrderByQuestionIdAsc();
		FinancialQuestion question = null;
		if (!questions.isEmpty()) {
			int index = (int) Math.floorMod(today.toEpochDay(), questions.size());
			question = questions.get(index);
		}
		if (todayActivity != null && todayActivity.getQuestionId() != null) {
			question = questionRepository.findById(todayActivity.getQuestionId()).orElse(question);
		}

		PracticeHubResponse.Question questionView = question == null
			? null
			: new PracticeHubResponse.Question(question.getQuestionId(), question.getQuestionText(), OX_CHOICES);

		PracticeHubResponse.QuizResult quizResult = null;
		if (todayActivity != null && todayActivity.isQuizAnswered() && question != null) {
			int selectedIndex = Boolean.TRUE.equals(todayActivity.getSelectedAnswer()) ? 0 : 1;
			int correctIndex = question.correctIndex();
			quizResult = new PracticeHubResponse.QuizResult(
				selectedIndex,
				correctIndex,
				selectedIndex == correctIndex,
				question.getExplanation()
			);
		}

		return new PracticeHubResponse.Today(
			today,
			todayActivity != null && todayActivity.isQuizAnswered(),
			todayActivity != null && todayActivity.isPracticeCompleted(),
			questionView,
			quizResult
		);
	}

	private PracticeHubResponse.ReviewDifficulty pickReviewDifficulty(Long userId) {
		return transferDifficultyRepository.findByUserIdOrderByOccurredAtDesc(userId).stream()
			.filter(difficulty -> difficulty.getStep().isReviewable())
			.min(Comparator
				.comparing((TransferDifficulty difficulty) -> difficulty.isCompleted())
				.thenComparing(TransferDifficulty::getOccurredAt, Comparator.reverseOrder()))
			.map(difficulty -> new PracticeHubResponse.ReviewDifficulty(
				difficulty.getDifficultyId(),
				difficulty.getStep().getCode(),
				difficulty.getReason() == null ? null : difficulty.getReason().getCode(),
				difficulty.getOccurredAt(),
				difficulty.isCompleted()
			))
			.orElse(null);
	}
}
