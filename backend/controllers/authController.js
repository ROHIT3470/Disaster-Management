import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
}

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email and password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must contain at least 6 characters",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const exists = await User.findOne({ email: normalizedEmail });

  if (exists) {
    return res.status(409).json({
      success: false,
      message: "Email is already registered",
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  res.status(201).json({
    success: true,
    user: sanitizeUser(user),
    token: signToken(user.id),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!user || !user.active || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  res.json({
    success: true,
    user: sanitizeUser(user),
    token: signToken(user.id),
  });
}

export async function me(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

export async function forgotPassword(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please provide an email address.",
    });
  }

  const user = await User.findOne({ email });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    try {
      await sendPasswordResetEmail({
        recipient: user.email,
        resetUrl,
      });
    } catch (emailError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Password Reset] Email delivery unavailable; returning a development-only reset link. ${emailError.message}`,
        );

        return res.json({
          success: true,
          message:
            "Email delivery is unavailable in development. Use the generated reset link below.",
          resetUrl,
          developmentOnly: true,
        });
      }

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error("[Password Reset Email Error]", emailError.message);

      return res.status(503).json({
        success: false,
        message: "Password reset email delivery is temporarily unavailable. Please try again later.",
      });
    }
  }

  return res.json({
    success: true,
    message: "If an account exists with that email, password reset instructions have been sent.",
  });
}

export async function resetPassword(req, res) {
  const token = (req.params?.token || req.body?.token || "").trim();
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Reset token is required.",
    });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must contain at least 6 characters.",
    });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "This reset link is invalid or has expired.",
    });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.json({
    success: true,
    message: "Your password has been reset successfully. You can now sign in.",
  });
}
