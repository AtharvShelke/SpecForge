import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "atharvshelke964@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || ""; // Note: You need to set this to your App Password in .env
const SMTP_FROM = process.env.SMTP_FROM || `"MD Client" <atharvshelke964@gmail.com>`;

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports like 587
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

export interface SendMailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }[];
}

/**
 * Sends an email using the configured SMTP transporter.
 * @param options Email options (to, subject, text, html, from)
 */
export const sendMail = async (options: SendMailOptions) => {
    try {
        const info = await transporter.sendMail({
            from: options.from || SMTP_FROM,
            to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
            attachments: options.attachments,
        });

        console.log("Email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
