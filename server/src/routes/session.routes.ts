import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";

type AuthedRequest = Request & {
  userId?: string;
};

const router = Router();

router.use(authMiddleware);

// Seans oluştur
const createSession: RequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).userId;

    if (!userId) {
      res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
      return;
    }

    const {
      taskId,
      type,
      durationMin,
      startedAt,
      completedAt,
      wasInterrupted,
      notes,
    } = req.body;

    if (!type || !durationMin || !startedAt || !completedAt) {
      res.status(400).json({ message: "Eksik seans bilgisi." });
      return;
    }

    const session = await prisma.pomodoroSession.create({
      data: {
        userId,
        taskId: taskId ?? null,
        type,
        durationMin,
        startedAt: new Date(startedAt),
        completedAt: new Date(completedAt),
        wasInterrupted: wasInterrupted ?? false,
        notes: notes ?? null,
      },
    });

    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ message: "Seans kaydedilemedi." });
  }
};

// Seansları getir
const getSessions: RequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).userId;

    if (!userId) {
      res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
      return;
    }

    const sessions = await prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 50,
    });

    res.json({ sessions });
  } catch {
    res.status(500).json({ message: "Seanslar alınamadı." });
  }
};

// Bugünkü özet
const getTodaySummary: RequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).userId;

    if (!userId) {
      res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySessions = await prisma.pomodoroSession.findMany({
      where: {
        userId,
        type: "work",
        wasInterrupted: false,
        completedAt: {
          gte: startOfToday,
        },
      },
    });

    const allWorkSessions = await prisma.pomodoroSession.findMany({
      where: {
        userId,
        type: "work",
        wasInterrupted: false,
      },
      select: {
        completedAt: true,
      },
    });

    const count = todaySessions.length;

    const totalMinutes = todaySessions.reduce(
      (sum, session) => sum + session.durationMin,
      0,
    );

    const streak = calculateStreak(allWorkSessions);

    res.json({
      count,
      totalMinutes,
      streak,
    });
  } catch {
    res.status(500).json({ message: "Bugünkü özet alınamadı." });
  }
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateStreak(sessions: { completedAt: Date }[]) {
  const completedDays = new Set(
    sessions.map((session) => getDateKey(session.completedAt)),
  );

  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    if (completedDays.has(getDateKey(date))) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

router.post("/", createSession);
router.get("/", getSessions);
router.get("/today-summary", getTodaySummary);

export default router;
