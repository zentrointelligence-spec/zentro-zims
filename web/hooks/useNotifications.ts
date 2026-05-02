"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  fetchNotifications,
  markAllReadInStorage,
  markReadInStorage,
  type Notification,
} from "@/lib/notifications-client";

const POLL_MS = 60_000;

export function useNotifications(panelOpen: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previousCount, setPreviousCount] = useState(0);
  const firstFetchRef = useRef(true);
  const notificationsRef = useRef<Notification[]>([]);
  const panelOpenRef = useRef(panelOpen);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    panelOpenRef.current = panelOpen;
  }, [panelOpen]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const runFetch = useCallback(async () => {
    const priorUnread = notificationsRef.current.filter((n) => !n.read).length;
    const data = await fetchNotifications();
    const newUnread = data.filter((n) => !n.read).length;
    const open = panelOpenRef.current;
    const isFirst = firstFetchRef.current;

    if (!isFirst && newUnread > priorUnread && !open) {
      const delta = newUnread - priorUnread;
      toast.info(
        `You have ${delta} new notification${delta === 1 ? "" : "s"}`,
      );
    }

    if (isFirst) {
      setPreviousCount(newUnread);
      firstFetchRef.current = false;
    } else {
      setPreviousCount(priorUnread);
    }

    setNotifications(data);
    setIsLoading(false);
  }, []);

  const markRead = useCallback((id: string) => {
    markReadInStorage(id);
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      const u = next.filter((p) => !p.read).length;
      queueMicrotask(() => setPreviousCount(u));
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const ids = notificationsRef.current.map((n) => n.id);
    markAllReadInStorage(ids);
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      queueMicrotask(() => setPreviousCount(0));
      return next;
    });
  }, []);

  const refetch = useCallback(() => {
    void runFetch();
  }, [runFetch]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      void runFetch();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        void runFetch();
      }, POLL_MS);
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVis = () => {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        start();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    } else {
      void runFetch();
    }

    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [runFetch]);

  return {
    notifications,
    isLoading,
    unreadCount,
    previousCount,
    markRead,
    markAllRead,
    refetch,
  };
}
