import { NextRequest, NextResponse } from "next/server";
import { sendSmtpEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body as {
      name?: string;
      email?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_REPORT_EMAIL ?? "help@outageintel.org";

    try {
      await sendSmtpEmail({
        to: adminEmail,
        subject: `📩 New contact message from ${name}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          "",
          "Message:",
          message,
        ].join("\n"),
        replyTo: email,
      });

      await sendSmtpEmail({
        to: email,
        subject: "Thank you for reaching OutageIntel",
        text: "Thank you for reaching us. We will get back to you ASAP.",
      });
    } catch (mailErr) {
      console.error("[Contact API] SMTP send failed:", mailErr);
    }

    return NextResponse.json(
      { ok: true, message: "Message received. We will get back to you ASAP!" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Contact API] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
