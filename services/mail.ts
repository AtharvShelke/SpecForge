import nodemailer from "nodemailer";
import { getMailConfig, isMailConfigured } from "@/lib/env";

const mailConfig = getMailConfig();
const SMTP_PORT = Number(mailConfig.port || "0");

const transporter = nodemailer.createTransport({
    host: mailConfig.host || undefined,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
        user: mailConfig.user || undefined,
        pass: mailConfig.pass || undefined,
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
        if (!isMailConfigured()) {
            throw new Error("SMTP mail transport is not configured.");
        }

        const info = await transporter.sendMail({
            from: options.from || mailConfig.from || undefined,
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
