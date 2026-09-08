package com.danbi.domain.onboarding.entity;

public enum FaceCaptureStage {
	FRONT_INITIAL,
	RIGHT,
	LEFT,
	FRONT_FINAL;

	public FaceCaptureStage next() {
		return switch (this) {
			case FRONT_INITIAL -> RIGHT;
			case RIGHT -> LEFT;
			case LEFT -> FRONT_FINAL;
			case FRONT_FINAL -> null;
		};
	}

	public boolean isFinal() {
		return this == FRONT_FINAL;
	}
}
