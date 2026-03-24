import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Alert, CalibrationProfile, SessionSnapshot } from "../backend.d";
import { useActor } from "./useActor";

export function useCalibrationProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<CalibrationProfile | null>({
    queryKey: ["calibrationProfile"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getCalibrationProfile();
      return result ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSessionHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<SessionSnapshot[]>({
    queryKey: ["sessionHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessionHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAlerts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useSaveCalibrationProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      typingSpeed,
      mouseMovement,
      accuracy,
    }: { typingSpeed: number; mouseMovement: number; accuracy: number }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCalibrationProfile(typingSpeed, mouseMovement, accuracy);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calibrationProfile"] }),
  });
}

export function useRecordSnapshot() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      focus,
      fatigue,
      stress,
    }: { focus: number; fatigue: number; stress: number }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordSessionSnapshot(
        BigInt(focus),
        BigInt(fatigue),
        BigInt(stress),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessionHistory"] }),
  });
}

export function useAddAlert() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      alertType,
      message,
      severity,
    }: { alertType: string; message: string; severity: number }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addAlert(alertType, message, BigInt(severity));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
