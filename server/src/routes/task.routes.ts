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

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

const router = Router();

router.use(authMiddleware);

const getTasks: RequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).userId;

    if (!userId) {
      res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: {
          not: "archived",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: "Görevler alınamadı." });
  }
};

const createTask: RequestHandler = async (
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
      title,
      description,
      estimatedPomodoros,
      priority,
      tagLabel,
      tagColor,
      dueDate,
    } = req.body;

    if (!title || !String(title).trim()) {
      res.status(400).json({ message: "Görev adı zorunludur." });
      return;
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title: String(title).trim(),
        description: description ?? "",
        estimatedPomodoros: estimatedPomodoros ?? 1,
        completedPomodoros: 0,
        priority: priority ?? 2,
        tagLabel: tagLabel ?? "Diğer",
        tagColor: tagColor ?? "#8C8B9E",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: "Görev oluşturulamadı." });
  }
};

const updateTask: RequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).userId;
    const taskId = getParamValue(req.params.id);

    if (!taskId) {
      res.status(400).json({ message: "Task id is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Görev bulunamadı." });
      return;
    }

    const {
      title,
      description,
      status,
      estimatedPomodoros,
      completedPomodoros,
      priority,
      tagLabel,
      tagColor,
      dueDate,
      completedAt,
    } = req.body;

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(estimatedPomodoros !== undefined && { estimatedPomodoros }),
        ...(completedPomodoros !== undefined && { completedPomodoros }),
        ...(priority !== undefined && { priority }),
        ...(tagLabel !== undefined && { tagLabel }),
        ...(tagColor !== undefined && { tagColor }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(completedAt !== undefined && {
          completedAt: completedAt ? new Date(completedAt) : null,
        }),
      },
    });

    res.json({ task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Görev güncellenemedi." });
  }
};

const deleteTask: RequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).userId;
    const taskId = getParamValue(req.params.id);

    if (!taskId) {
      res.status(400).json({ message: "Task id is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Görev bulunamadı." });
      return;
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    res.json({ message: "Görev silindi." });
  } catch (error) {
    res.status(500).json({ message: "Görev silinemedi." });
  }
};

router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
