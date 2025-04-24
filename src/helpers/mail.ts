import easyYopmail from 'easy-yopmail';

// Import types from our declaration file
import { InboxResult, EmailMessage } from '../types/easy-yopmail-types.js';

interface MailResponse<T> {
  content: T;
  isError: boolean;
}

class MailSanbox {
  generateEmail = async function(): Promise<MailResponse<string>> {
    const email = await easyYopmail.getMail();
    return {
      content: email,
      isError: false,
    };
  }

  readInbox = async function(email: string): Promise<MailResponse<InboxResult>> {
    const inbox = await easyYopmail.getInbox(email);
    return {
      content: inbox,
      isError: false,
    };
  }

  readMessage = async function(email: string, messageId: string, format: "TXT" | "HTML"): Promise<MailResponse<EmailMessage>> {
    const message = await easyYopmail.readMessage(email, messageId, { 
      format: format === "TXT" ? "txt" : "html" 
    });
    return {
      content: message,
      isError: false,
    };
  }
}

export default MailSanbox;