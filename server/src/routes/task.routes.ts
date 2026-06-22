import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
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

    return res.json({ tasks });
  } catch (error) {
    return res.status(500).json({ message: "Görevler alınamadı." });
  }
});

// Yeni görev oluştur
router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
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

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Görev adı zorunludur." });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        description: description ?? "",
        estimatedPomodoros: estimatedPomodoros ?? 1,
        completedPomodoros: 0,
        priority: priority ?? 2,
        tagLabel: tagLabel ?? "Diğer",
        tagColor: tagColor ?? "#8C8B9E",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return res.status(201).json({ task });
  } catch (error) {
    return res.status(500).json({ message: "Görev oluşturulamadı." });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const taskId = getParamValue(req.params.id);

    if (!taskId) {
      return res.status(400).json({ message: "Task id is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Görev bulunamadı." });
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

    return res.json({ task: updatedTask });
  } catch (error) {
    return res.status(500).json({ message: "Görev güncellenemedi." });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const taskId = getParamValue(req.params.id);

    if (!taskId) {
      return res.status(400).json({ message: "Task id is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Görev bulunamadı." });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return res.json({ message: "Görev silindi." });
  } catch (error) {
    return res.status(500).json({ message: "Görev silinemedi." });
  }
});

export default router;
