package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.entity.IdCardType;
import java.time.LocalDate;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class PrototypeIdCardOcrClient implements IdCardOcrClient {

	private static final String RECOGNIZED_NAME = "박옥순";
	private static final String MASKED_ID_NUMBER = "900101-1******";
	private static final LocalDate ISSUE_DATE = LocalDate.of(2020, 3, 12);

	@Override
	public IdCardOcrResult recognize(IdCardType idCardType, MultipartFile image) {
		return new IdCardOcrResult(RECOGNIZED_NAME, MASKED_ID_NUMBER, ISSUE_DATE);
	}
}
