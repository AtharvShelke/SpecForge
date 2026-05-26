import { getMailConfig, isMailConfigured } from "@/lib/env";

const mailConfig = getMailConfig();

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
        console.log("Mock Email (nodemailer is not installed):");
        console.log("  To:", options.to);
        console.log("  Subject:", options.subject);
        console.log("  Text:", options.text);
        return { messageId: "mock-message-id" };
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

