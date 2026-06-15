"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";
type LogCategory = "AUTH" | "PAYMENT" | "ENROLLMENT" | "ADMIN" | "CRON" | "SYSTEM";

interface LogOptions {
  userId?: string;
  ip?: string;
  meta?: Prisma.InputJsonValue;
}

export async function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  options: LogOptions = {}
) {
  try {
    await prisma.systemLog.create({
      data: {
        level,
        category,
        message,
        meta: (options.meta ?? undefined) as Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined,
        userId: options.userId,
        ip: options.ip,
      },
    });
  } catch {
    // 로깅 실패가 핵심 기능을 막으면 안 됨
    console.error("[logger] failed to write log:", message);
  }
}

export const logger = {
  info: (category: LogCategory, message: string, opts?: LogOptions) =>
    log("INFO", category, message, opts),
  warn: (category: LogCategory, message: string, opts?: LogOptions) =>
    log("WARN", category, message, opts),
  error: (category: LogCategory, message: string, opts?: LogOptions) =>
    log("ERROR", category, message, opts),
  debug: (category: LogCategory, message: string, opts?: LogOptions) =>
    log("DEBUG", category, message, opts),
};
