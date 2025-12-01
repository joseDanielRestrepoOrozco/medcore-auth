export interface EmailHug {
  ID: string;
  From: From;
  To: From[];
  Content: Content;
  Created: Date;
  MIME: null;
  Raw: Raw;
}

export interface Content {
  Headers: Headers;
  Body: string;
  Size: number;
  MIME: null;
}

export interface Headers {
  'Content-Transfer-Encoding': string[];
  'Content-Type': string[];
  Date: string[];
  From: string[];
  'MIME-Version': string[];
  'Message-ID': string[];
  Received: string[];
  'Return-Path': string[];
  Subject: string[];
  To: string[];
}

export interface From {
  Relays: null;
  Mailbox: string;
  Domain: string;
  Params: string;
}

export interface Raw {
  From: string;
  To: string[];
  Data: string;
  Helo: string;
}
