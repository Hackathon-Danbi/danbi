package com.danbi.domain.practice.config;

import com.danbi.domain.practice.entity.FinancialQuestion;
import com.danbi.domain.practice.entity.MissionType;
import com.danbi.domain.practice.entity.PracticeMission;
import com.danbi.domain.practice.repository.FinancialQuestionRepository;
import com.danbi.domain.practice.repository.PracticeMissionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 연습모드 카탈로그(미션 7종 · O/X 문제)를 최초 1회 시드한다.
 * 프론트 features/missions/data 의 상수를 옮긴 값이며, 테이블이 비어 있을 때만 삽입한다.
 */
@Component
@Order(100)
@RequiredArgsConstructor
public class PracticeDataSeeder implements ApplicationRunner {

	private final PracticeMissionRepository missionRepository;
	private final FinancialQuestionRepository questionRepository;

	@Override
	public void run(ApplicationArguments args) {
		seedMissions();
		seedQuestions();
	}

	private void seedMissions() {
		if (missionRepository.count() > 0) {
			return;
		}
		List<PracticeMission> missions = List.of(
			mission("guided-transfer", MissionType.TRANSFER,
				"단계별로 송금 따라하기", "화면 안내에 따라 차근차근 연습해요", 10),
			mission("voice-transfer", MissionType.TRANSFER,
				"음성으로 송금해보기", "말로 받는 사람과 금액을 알려주세요", 15),
			mission("solo-transfer", MissionType.TRANSFER,
				"혼자 송금해보기", "안내 없이 직접 입력해서 완료해요", 20),
			mission("review-transfer", MissionType.TRANSFER,
				"송금 전 이름·계좌·금액 확인하기", "보내기 전에 한 번 더 꼼꼼히 확인해요", 15),
			mission("phishing-cases", MissionType.PHISHING_LEARN,
				"최신 보이스피싱 사례 알아보기", "실제로 일어난 사례를 함께 살펴봐요", 10),
			mission("phishing-prevention", MissionType.PHISHING_LEARN,
				"보이스피싱 예방법 익히기", "피해를 막는 간단한 방법을 배워요", 10),
			mission("phishing-simulation", MissionType.PHISHING_SIM,
				"의심스러운 전화 상황 경험하기", "실제 상황처럼 연습해 보고 대처해요", 20)
		);
		missionRepository.saveAll(missions);
	}

	private void seedQuestions() {
		if (questionRepository.count() > 0) {
			return;
		}
		List<FinancialQuestion> questions = List.of(
			question("검찰이나 금융기관이 전화로 \"안전계좌로 돈을 보내라\"고 요구할 수 있다", false,
				"정답은 X예요. 검찰과 금융기관은 절대 전화로 계좌 이체를 요구하지 않아요. 이런 전화는 100% 보이스피싱이에요."),
			question("출처를 모르는 문자 속 링크를 클릭해도 괜찮다", false,
				"정답은 X예요. 모르는 링크를 누르면 개인정보가 빠져나가거나 악성 앱이 설치될 수 있어요. 절대 클릭하지 마세요."),
			question("송금 전에 받는 사람의 이름과 계좌번호를 반드시 확인해야 한다", true,
				"정답은 O예요. 잘못 보내면 돌려받기 어려울 수 있어요. 보내기 전에 꼭 한 번 더 확인하세요."),
			question("이체는 실행 후 즉시 취소할 수 있다", false,
				"정답은 X예요. 이체는 실행되면 즉시 상대방 계좌로 들어가요. 취소가 아니라 반환 요청만 가능해요."),
			question("낯선 사람이 \"대신 이체해 달라\"고 부탁하면 도와줘도 된다", false,
				"정답은 X예요. 타인의 요청으로 이체하면 자신도 모르게 범죄에 연루될 수 있어요. 항상 거절하세요."),
			question("비밀번호는 메모장에 적어두면 잊어버리지 않아서 좋다", false,
				"정답은 X예요. 메모장은 분실될 수 있어요. 비밀번호는 머릿속에만 기억하거나, 잊으면 은행에서 재설정하세요."),
			question("ATM에서 비밀번호를 입력할 때 손으로 가리는 것이 좋다", true,
				"정답은 O예요. 어깨 너머로 비밀번호를 훔쳐보는 피해를 막을 수 있어요. 항상 손으로 가려주세요."),
			question("은행 예금보호한도는 금융회사별 1인당 1억 원이다", true,
				"정답은 O예요. 2025년 9월 1일부터 원금과 이자를 합쳐 금융회사별 1인당 최대 1억 원까지 보호받을 수 있어요."),
			question("금리가 높을수록 이자를 더 많이 받는다", true,
				"정답은 O예요. 같은 금액을 같은 기간 맡겨도 금리가 높을수록 이자가 더 많아요. 금리 비교는 필수예요."),
			question("체크카드는 통장 잔액 이상으로 사용할 수 없다", true,
				"정답은 O예요. 체크카드는 통장에 있는 돈만큼만 쓸 수 있어요. 잔액이 없으면 결제가 거절돼요."),
			question("분실한 카드를 즉시 신고하면 이후 부정 사용을 막을 수 있다", true,
				"정답은 O예요. 카드를 잃어버리면 바로 카드사 고객센터에 분실 신고를 하세요. 신고 후 부정 사용은 보상받을 수 있어요."),
			question("자동이체 날짜에 잔액이 부족하면 자동으로 이체된다", false,
				"정답은 X예요. 잔액이 부족하면 자동이체가 실패해요. 이체일 전날까지 필요한 금액을 입금해두세요."),
			question("공공 와이파이에서 인터넷 뱅킹을 이용해도 안전하다", false,
				"정답은 X예요. 공공 와이파이는 해킹에 취약해요. 인터넷 뱅킹은 반드시 개인 통신망에서 이용하세요.")
		);
		questionRepository.saveAll(questions);
	}

	private PracticeMission mission(String code, MissionType type, String title, String description, int scoreReward) {
		return PracticeMission.builder()
			.code(code)
			.missionType(type)
			.title(title)
			.description(description)
			.scoreReward(scoreReward)
			.build();
	}

	private FinancialQuestion question(String text, boolean correctAnswer, String explanation) {
		return FinancialQuestion.builder()
			.questionText(text)
			.correctAnswer(correctAnswer)
			.explanation(explanation)
			.build();
	}
}
