package com.danbi.domain.onboarding.service;

import com.danbi.domain.onboarding.entity.IdCardType;
import org.springframework.web.multipart.MultipartFile;

public interface IdCardOcrClient {

	IdCardOcrResult recognize(IdCardType idCardType, MultipartFile image);
}
