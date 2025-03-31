declare module 'easy-yopmail' {
  interface InboxMessage {
    id: string;
    from: string;
    subject: string;
    date: string;
  }

  interface InboxResponse {
    totalEmails: number;
    inbox: InboxMessage[];
  }

  interface MessageContent {
    content: string;
    info: any;
  }

  interface Attachment {
    fullName: string;
    name: string;
    extension: string;
    file: string;
  }

  interface ReadMessageResponse {
    id: string;
    submit: string;
    from: string;
    date: string;
    deliverability: string;
    attachments: Attachment[];
    saveAttachment: boolean;
    format: 'txt' | 'html';
    selector?: string;
    eq?: string;
    attribute?: string;
    pathToSave?: string;
    content: string;
    info: any;
  }

  interface EasyYopmail {
    getMail(): Promise<string>;
    getInbox(email: string, options?: any, limit?: { LIMIT: number }): Promise<InboxResponse>;
    readMessage(email: string, messageId: string, options?: {
      format?: 'txt' | 'html';
      selector?: string;
      attribute?: string;
      pathToSave?: string;
      eq?: number;
      saveAttachment?: boolean;
    }): Promise<ReadMessageResponse>;
  }

  const easyYopmail: EasyYopmail;
  export default easyYopmail;
} 