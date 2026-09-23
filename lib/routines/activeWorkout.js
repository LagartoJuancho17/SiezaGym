"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sieza_active_workout";
const EVENT_NAME = "sieza_active_workout_changed";

let memorySnapshot = null;

function readStorage() {
  if (typeof window === "undefined") return memorySnapshot;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return memorySnapshot;
  }
}

export function getActiveWorkout() {
  if (memorySnapshot !== null) return memorySnapshot;
  memorySnapshot = readStorage();
  return memorySnapshot;
}

export function saveActiveWorkout(workout) {
  if (!workout) {
    clearActiveWorkout();
    return;
  }
  const data = {
    ...workout,
    updatedAt: Date.now(),
  };
  memorySnapshot = data;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: data }));
    } catch {
      // LocalStorage quota or access error
    }
  }
}

export function clearActiveWorkout() {
  memorySnapshot = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
    } catch {
      // LocalStorage access error
    }
  }
}

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};

  function handleStorage(e) {
    if (e.key === STORAGE_KEY || e.type === EVENT_NAME) {
      memorySnapshot = readStorage();
      callback();
    }
  }

  window.addEventListener(EVENT_NAME, handleStorage);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, handleStorage);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot() {
  return getActiveWorkout();
}

function getServerSnapshot() {
  return null;
}

export function useActiveWorkout() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
