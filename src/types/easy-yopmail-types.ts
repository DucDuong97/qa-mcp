export interface MailOptions {
  format?: 'txt' | 'html';
  selector?: string | null;
  attribute?: string | null;
  pathToSave?: string | null;
  saveAttachment?: boolean;
}

export interface EmailAttachment {
  fullName: string;
  name: string;
  extension: string;
  file: string;
}

export interface EmailMessage {
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

export interface InboxItem {
  id: string;
  from: string;
  subject: string;
  timestamp: string;
  page: number;
}

export interface InboxResult {
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