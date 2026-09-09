package com.danbi.domain.practice.service;

import com.danbi.domain.practice.dto.CompletePracticeRequest;
import com.danbi.domain.practice.dto.PracticeCompletionResult;
import com.danbi.domain.practice.dto.PracticeMissionResponse;
import com.danbi.domain.practice.dto.PracticeMissionsResponse;
import com.danbi.domain.practice.dto.QuizAnswerRequest;
import com.danbi.domain.practice.dto.QuizAnswerResult;
import com.danbi.domain.practice.dto.TodayDailyActivityResponse;
import com.danbi.domain.practice.entity.DailyActivity;
import com.danbi.domain.practice.entity.FinancialQuestion;
import com.danbi.domain.practice.entity.MissionType;
import com.danbi.domain.practice.entity.PracticeMission;
import com.danbi.domain.practice.entity.UserMissionProgress;
import com.danbi.domain.practice.repository.DailyActivityRepository;
import com.danbi.domain.practice.repository.FinancialQuestionRepository;
import com.danbi.domain.practice.repository.PracticeMissionRepository;
import com.danbi.domain.practice.repository.UserMissionProgressRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * "나의 금융 독립"(연습모드) 백엔드. FE {@code financialIndependenceApi} / {@code practiceApi} 계약에 맞춘다.
 * 주간 도장·금융 독립 점수판은 FE가 로컬 데이터로 계산하므로 서버가 내려주지 않는다.
 * 로그인 도입 전까지 사용자 식별은 {@code userId}(기본 1), 개별 활동은 {@code dailyActivityId} 로 한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeService {

	/** 오늘의 대표 송금 연습 미션(없으면 TRANSFER 중 가장 앞). */
	private static final String DAILY_MISSION_CODE = "guided-transfer";

	private final PracticeMissionRepository missionRepository;
	private final FinancialQuestionRepository questionRepository;
	private final UserMissionProgressRepository progressRepository;
	private final DailyActivityRepository dailyActivityRepository;
	private final Clock clock;

	/** GET /api/daily-activities/today — 오늘 행이 없으면 만들고 문제를 배정한다. */
	@Transactional
	public TodayDailyActivityResponse getToday(Long userId) {
		LocalDate today = LocalDate.now(clock);
		PracticeMission mission = dailyMission();

		DailyActivity activity = dailyActivityRepository.findByUserIdAndActivityDate(userId, today)
			.orElseGet(() -> DailyActivity.start(userId, today));
		activity.assignQuestion(pickQuestionId(today));
		DailyActivity saved = dailyActivityRepository.save(activity);

		FinancialQuestion question = requireQuestion(saved.getQuestionId());
		return new TodayDailyActivityResponse(
			saved.getDailyActivityId(),
			today.toString(),
			new TodayDailyActivityResponse.Question(
				question.getQuestionId(),
				question.getQuestionText(),
				saved.getSelectedAnswer()
			),
			new TodayDailyActivityResponse.Mission(
				mission.getMissionId(),
				mission.getMissionType().name(),
				mission.getTitle(),
				mission.getDescription(),
				mission.getScoreReward()
			),
			saved.isPracticeCompleted(),
			saved.getEarnedScore()
		);
	}

	/** POST /api/daily-activities/{id}/answer — 하루 1회, 첫 응답 유지(멱등). */
	@Transactional
	public QuizAnswerResult answerQuiz(Long dailyActivityId, QuizAnswerRequest request) {
		DailyActivity activity = requireActivity(dailyActivityId);
		activity.assignQuestion(pickQuestionId(activity.getActivityDate()));
		FinancialQuestion question = requireQuestion(activity.getQuestionId());

		activity.answerQuiz(activity.getQuestionId(), request.selectedAnswer());
		dailyActivityRepository.save(activity);

		boolean stored = Boolean.TRUE.equals(activity.getSelectedAnswer());
		return new QuizAnswerResult(
			question.getQuestionId(),
			stored,
			stored == question.isCorrectAnswer(),
			question.isCorrectAnswer(),
			question.getExplanation(),
			activity.getEarnedScore()
		);
	}

	/** PATCH /api/daily-activities/{id}/practice — 점수는 미션당 최초 1회만 반영. */
	@Transactional
	public PracticeCompletionResult completePractice(Long dailyActivityId, CompletePracticeRequest request) {
		DailyActivity activity = requireActivity(dailyActivityId);
		PracticeMission mission = missionRepository.findById(request.missionId())
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND, "연습을 찾을 수 없습니다: " + request.missionId()));

		UserMissionProgress progress = progressRepository
			.findByUserIdAndMissionId(activity.getUserId(), mission.getMissionId())
			.orElseGet(() -> UserMissionProgress.of(activity.getUserId(), mission.getMissionId()));
		progress.markCompleted(clock);
		progressRepository.save(progress);

		activity.completePractice(mission.getMissionId(), mission.getScoreReward());
		dailyActivityRepository.save(activity);

		return new PracticeCompletionResult(
			activity.getDailyActivityId(),
			mission.getMissionId(),
			activity.isPracticeCompleted(),
			activity.getEarnedScore()
		);
	}

	/** GET /api/practice/missions — 송금 연습 카탈로그({@code { missions: [...] }}). */
	public PracticeMissionsResponse listTransferMissions() {
		List<PracticeMissionResponse> missions = missionRepository.findAllByOrderByMissionIdAsc().stream()
			.filter(mission -> mission.getMissionType() == MissionType.TRANSFER)
			.map(PracticeMissionResponse::from)
			.toList();
		return new PracticeMissionsResponse(missions);
	}

	private DailyActivity requireActivity(Long dailyActivityId) {
		return dailyActivityRepository.findById(dailyActivityId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오늘의 활동을 찾을 수 없습니다."));
	}

	private FinancialQuestion requireQuestion(Long questionId) {
		return questionRepository.findById(questionId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "문제를 찾을 수 없습니다."));
	}

	private PracticeMission dailyMission() {
		return missionRepository.findByCode(DAILY_MISSION_CODE)
			.or(() -> missionRepository.findAllByOrderByMissionIdAsc().stream()
				.filter(mission -> mission.getMissionType() == MissionType.TRANSFER)
				.findFirst())
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.INTERNAL_SERVER_ERROR, "연습 미션 시드가 없습니다."));
	}

	/** 날짜별 결정적 문제 선택(문제은행을 하루씩 순회). */
	private Long pickQuestionId(LocalDate date) {
		List<FinancialQuestion> questions = questionRepository.findAllByOrderByQuestionIdAsc();
		if (questions.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "금융 문제 시드가 없습니다.");
		}
		int index = (int) Math.floorMod(date.toEpochDay(), questions.size());
		return questions.get(index).getQuestionId();
	}
}
