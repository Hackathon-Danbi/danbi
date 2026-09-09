package com.danbi.domain.practice.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.danbi.domain.practice.dto.PracticeMissionResponse;
import com.danbi.domain.practice.dto.PracticeMissionsResponse;
import com.danbi.domain.practice.service.PracticeService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** FE {@code practiceApi.getMissions} 계약: {@code { missions: [...] }} 래퍼. */
class PracticeControllerTest {

	private PracticeService practiceService;
	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		practiceService = mock(PracticeService.class);
		mockMvc = MockMvcBuilders.standaloneSetup(new PracticeController(practiceService)).build();
	}

	@Test
	void missions_returnsWrappedList() throws Exception {
		when(practiceService.listTransferMissions()).thenReturn(new PracticeMissionsResponse(List.of(
			new PracticeMissionResponse(1L, "TRANSFER", "단계별로 송금 따라하기", "화면 안내에 따라 차근차근 연습해요", 10),
			new PracticeMissionResponse(2L, "TRANSFER", "음성으로 송금해보기", "말로 받는 사람과 금액을 알려주세요", 15)
		)));

		mockMvc.perform(get("/api/practice/missions"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.missions.length()").value(2))
			.andExpect(jsonPath("$.missions[0].missionId").value(1))
			.andExpect(jsonPath("$.missions[0].missionType").value("TRANSFER"))
			.andExpect(jsonPath("$.missions[0].title").value("단계별로 송금 따라하기"))
			.andExpect(jsonPath("$.missions[0].scoreReward").value(10))
			.andExpect(jsonPath("$.missions[1].missionId").value(2));
	}
}
