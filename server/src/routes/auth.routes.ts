import bcrypt from "bcrypt";
import crypto from "crypto";
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../lib/mailer";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

function createAuthToken(userId: string) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET eksik.");
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: "7d",
  });
}

const router = Router();

function createToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Şifre en az 6 karakter olmalıdır." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Bu e-posta zaten kayıtlı." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName,
      },
    });

    const token = createToken(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Kayıt işlemi başarısız." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "E-posta ve şifre zorunludur." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        message: "E-posta veya şifre hatalı.",
      });
    }
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({ message: "E-posta veya şifre hatalı." });
    }

    const token = createToken(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Giriş işlemi başarısız." });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return res.status(500).json({ message: "Kullanıcı bilgisi alınamadı." });
  }
});

router.patch("/profile", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { displayName, avatarUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName,
        avatarUrl,
      },
    });

    return res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch {
    return res.status(500).json({ message: "Profil güncellenemedi." });
  }
});

router.delete("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Kullanıcı doğrulanamadı." });
    }

    await prisma.$transaction([
      prisma.pomodoroSession.deleteMany({
        where: {
          userId,
        },
      }),

      prisma.task.deleteMany({
        where: {
          userId,
        },
      }),

      prisma.user.delete({
        where: {
          id: userId,
        },
      }),
    ]);

    return res.json({ message: "Hesap silindi." });
  } catch (error) {
    return res.status(500).json({ message: "Hesap silinemedi." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Geçerli bir e-posta girin." });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Güvenlik için kullanıcı yoksa bile başarılı cevap dönüyoruz.
    if (!user) {
      return res.json({
        message: "Şifre sıfırlama kodu oluşturuldu.",
      });
    }

    const lastToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (lastToken) {
      const secondsSinceLastToken =
        (Date.now() - lastToken.createdAt.getTime()) / 1000;

      if (secondsSinceLastToken < 60) {
        return res.status(429).json({
          message: `Yeni kod istemek için ${Math.ceil(
            60 - secondsSinceLastToken,
          )} saniye bekleyin.`,
        });
      }
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const token = crypto.randomInt(100000, 1000000).toString();

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      },
    });

    await sendPasswordResetEmail(user.email, token);

    return res.json({
      message: "Şifre sıfırlama kodu e-posta adresine gönderildi.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Şifre sıfırlama başlatılamadı." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Kod ve yeni şifre zorunludur." });
    }

    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({
        message: "Sıfırlama kodu 6 haneli olmalıdır.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Yeni şifre en az 8 karakter olmalıdır.",
      });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token,
      },
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Geçersiz sıfırlama kodu." });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      });

      return res.status(400).json({
        message: "Sıfırlama kodunun süresi dolmuş.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
        },
      }),

      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
        },
      }),
    ]);

    return res.json({
      message: "Şifre başarıyla güncellendi.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Şifre güncellenemedi." });
  }
});

router.post("/google", async (req, res) => {
  try {
    console.log("GOOGLE LOGIN HIT");
    console.log("ID TOKEN BODY EXISTS:", Boolean(req.body.idToken));

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "Google token eksik.",
      });
    }

    const googleWebClientId = process.env.GOOGLE_WEB_CLIENT_ID;

    if (!googleWebClientId) {
      return res.status(500).json({
        message: "GOOGLE_WEB_CLIENT_ID eksik.",
      });
    }

    console.log("GOOGLE LOGIN HIT");
    console.log("ENV GOOGLE_WEB_CLIENT_ID:", process.env.GOOGLE_WEB_CLIENT_ID);
    console.log("ID TOKEN BODY EXISTS:", Boolean(req.body.idToken));

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleWebClientId,
    });

    const payload = ticket.getPayload();
    console.log("GOOGLE PAYLOAD:", {
      email: payload?.email,
      emailVerified: payload?.email_verified,
      aud: payload?.aud,
      azp: payload?.azp,
    });

    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({
        message: "Google hesabı doğrulanamadı.",
      });
    }

    if (!payload.email_verified) {
      return res.status(401).json({
        message: "Google e-posta adresi doğrulanmamış.",
      });
    }

    const email = payload.email.toLowerCase();
    const googleDisplayName = payload.name?.trim() || "Kullanıcı";

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          displayName: payload.name || email.split("@")[0],
          email,
          passwordHash: null,
          googleId: payload.sub,
          avatarUrl: payload.picture || null,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || payload.sub,
          avatarUrl: payload.picture || user.avatarUrl,
          displayName:
            user.displayName === "Kullanıcı" || !user.displayName
              ? googleDisplayName
              : user.displayName,
        },
      });
    }

    const token = createAuthToken(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("GOOGLE LOGIN ERROR:", error);

    return res.status(500).json({
      message: error?.message ?? "Google ile giriş yapılamadı.",
    });
  }
});

export default router;
