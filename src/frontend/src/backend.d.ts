import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CalibrationProfile {
    lastUpdated: bigint;
    mouseMovementBaseline: number;
    calibrationAccuracy: number;
    typingSpeedBaseline: number;
}
export interface SessionSnapshot {
    fatigueScore: bigint;
    focusScore: bigint;
    stressScore: bigint;
    timestamp: bigint;
}
export interface Alert {
    alertType: string;
    message: string;
    timestamp: bigint;
    severity: bigint;
}
export interface backendInterface {
    addAlert(alertType: string, message: string, severity: bigint): Promise<void>;
    clearUserData(): Promise<void>;
    getAlerts(): Promise<Array<Alert>>;
    getCalibrationProfile(): Promise<CalibrationProfile | null>;
    getSessionHistory(): Promise<Array<SessionSnapshot>>;
    recordSessionSnapshot(focus: bigint, fatigue: bigint, stress: bigint): Promise<void>;
    saveCalibrationProfile(typingSpeed: number, mouseMovement: number, accuracy: number): Promise<void>;
}
