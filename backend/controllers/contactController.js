import ContactMessage from "../models/ContactMessage.js";

export async function createContactMessage(req, res) {
  const { name, email, subject, message } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof subject !== "string" ||
    typeof message !== "string" ||
    name.trim().length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    subject.trim().length < 3 ||
    message.trim().length < 10
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid name, email, subject, and message.",
    });
  }

  const contactMessage = await ContactMessage.create({
    name: name.trim().slice(0, 100),
    email: email.trim().toLowerCase().slice(0, 200),
    subject: subject.trim().slice(0, 160),
    message: message.trim().slice(0, 1000),
  });

  return res.status(201).json({
    success: true,
    message: "Your support message was received.",
    id: contactMessage._id,
  });
}
