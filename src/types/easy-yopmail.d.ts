declare module 'easy-yopmail' {
  interface MailOptions {
    format?: 'txt' | 'html';
    selector?: string | null;
    attribute?: string | null;
    pathToSave?: string | null;
    saveAttachment?: boolean;
  }

  interface EmailAttachment {
    fullName: string;
    name: string;
    extension: string;
    file: string;
  }

  interface EmailMessage {
    id: string;
    submit: string;
    from: string;
    date: string;
    deliverability: string;
    attachments: EmailAttachment[];
    saveAttachment: boolean;
    format: string;
    selector: string | null;
    eq: string | null;
    attribute: string | null;
    pathToSave: string | null;
    content: string | string[];
    info: string[];
  }

  interface InboxItem {
    id: string;
    from: string;
    subject: string;
    timestamp: string;
    page: number;
  }

  interface InboxResult {
    mail: string;
    settings: {
      LIMIT: number;
    };
    filteredSearch: Record<string, string>;
    pageCount: number;
    totalEmails: number;
    emailsPerPageCount: Record<string, number>;
    exploredPageCount: number;
    fetchedEmailCount: number;
    inbox: InboxItem[];
  }

  export function getMail(): Promise<string>;
  export function getInbox(email: string, search?: Record<string, string>, options?: { LIMIT: number }): Promise<InboxResult>;
  export function readMessage(email: string, messageId: string, options?: MailOptions): Promise<EmailMessage>;
  export function deleteMessage(email: string, messageId: string): Promise<string>;
  export function deleteInbox(email: string): Promise<string>;
  export function writeMessage(email: string, to: string, subject: string, body: string): Promise<string>;

  const easyYopmail: {
    getMail: typeof getMail;
    getInbox: typeof getInbox;
    readMessage: typeof readMessage;
    deleteMessage: typeof deleteMessage;
    deleteInbox: typeof deleteInbox;
    writeMessage: typeof writeMessage;
  };

  export default easyYopmail;
} 