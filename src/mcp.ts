#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolResult,
  TextContent,
  ImageContent,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

import puppeteer, { Browser, ElementHandle, Page } from "puppeteer";
import mysql from 'mysql2/promise';
import easyYopmail from 'easy-yopmail';


const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a database URL as a command-line argument");
  process.exit(1);
}

const databaseUrl = args[0];

const resourceBaseUrl = new URL(databaseUrl);
resourceBaseUrl.protocol = "mysql:";
resourceBaseUrl.password = "";

const dbConfig = new URL(databaseUrl);
const pool = mysql.createPool({
  host: dbConfig.hostname,
  user: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.pathname.substring(1),
  port: parseInt(dbConfig.port || '3306'),
  connectionLimit: 10
});


// Define the tools once to avoid repetition
const TOOLS: Tool[] = [
  {
    name: "mysql_query",
    description: "Run a read-only SQL query",
    inputSchema: {
      type: "object",
      properties: {
        sql: { type: "string" },
      },
    },
  },
  {
    name: "yopmail_generate_email",
    description: "Generate a new random YopMail email address",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "yopmail_read_inbox",
    description: "Read emails from a specific YopMail inbox",
    inputSchema: {
      type: "object",
      properties: {
        email: { 
          type: "string",
          description: "The YopMail email address to read from (without @yopmail.com)"
        },
      },
      required: ["email"],
    },
  },
  {
    name: "yopmail_read_message",
    description: "Read a specific email message from a YopMail inbox",
    inputSchema: {
      type: "object",
      properties: {
        email: { 
          type: "string",
          description: "The YopMail email address (without @yopmail.com)"
        },
        messageId: {
          type: "string",
          description: "The ID of the message to read"
        },
        format: {
          type: "string",
          enum: ["TXT", "HTML"],
          description: "The format to read the message in"
        }
      },
      required: ["email", "messageId", "format"],
    },
  },
  {
    name: "puppeteer_navigate",
    description: "Navigate to a URL",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
      },
      required: ["url"],
    },
  },
  {
    name: "puppeteer_screenshot",
    description: "Take a screenshot of the current page or a specific element",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the screenshot" },
        selector: { type: "string", description: "CSS selector for element to screenshot" },
        width: { type: "number", description: "Width in pixels (default: 1200)" },
        height: { type: "number", description: "Height in pixels (default: 600)" },
      },
      required: ["name"],
    },
  },
  {
    name: "puppeteer_click",
    description: "Click an element on the page",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Specific text that is inside the element to click" },
        aria_label: { type: "string", description: "Specific aria-label of the element to click" },
        test_id: { type: "string", description: "Specific data-testid of the element to click" },
      },
      required: [],
    },
  },
  {
    name: "puppeteer_fill",
    description: "Fill out an input field",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector for input field" },
        value: { type: "string", description: "Value to fill" },
      },
      required: ["selector", "value"],
    },
  },
  {
    name: "puppeteer_select",
    description: "Select an element on the page with Select tag",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector for element to select" },
        value: { type: "string", description: "Value to select" },
      },
      required: ["selector", "value"],
    },
  },
  {
    name: "puppeteer_hover",
    description: "Hover an element on the page",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector for element to hover" },
      },
      required: ["selector"],
    },
  },
  {
    name: "puppeteer_evaluate",
    description: "Execute JavaScript in the browser console",
    inputSchema: {
      type: "object",
      properties: {
        script: { type: "string", description: "JavaScript code to execute" },
      },
      required: ["script"],
    },
  },
];

// Global state
let browser: Browser | undefined;
let page: Page | undefined;
const consoleLogs: string[] = [];
const screenshots = new Map<string, string>();

async function ensureBrowser() {
  if (!browser) {
    const npx_args = { 
      headless: false,
      defaultViewport: { width: 1200, height: 600 }
    }
    const docker_args = { headless: true, args: ["--no-sandbox", "--single-process", "--no-zygote"] }
    browser = await puppeteer.launch(process.env.DOCKER_CONTAINER ? docker_args : npx_args);
    const pages = await browser.pages();
    page = pages[0];

    page.on("console", (msg) => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logEntry);
      server.notification({
        method: "notifications/resources/updated",
        params: { uri: "console://logs" },
      });
    });
  }
  return page!;
}

declare global {
  interface Window {
    mcpHelper: {
      logs: string[],
      originalConsole: Partial<typeof console>,
    }
  }
}

async function handleToolCall(name: string, args: any): Promise<CallToolResult> {

  if (name.startsWith("puppeteer_")) {
    const page = await ensureBrowser();

    switch (name) {
      case "puppeteer_navigate":
        await page.goto(args.url);
        return {
          content: [{
            type: "text",
            text: `Navigated to ${args.url}`,
          }],
          isError: false,
        };
  
      case "puppeteer_screenshot": {
        const width = args.width ?? 1200;
        const height = args.height ?? 600;
        await page.setViewport({ width, height });
  
        const screenshot = await (args.selector ?
          (await page.$(args.selector))?.screenshot({ encoding: "base64" }) :
          page.screenshot({ encoding: "base64", fullPage: false }));
  
        if (!screenshot) {
          return {
            content: [{
              type: "text",
              text: args.selector ? `Element not found: ${args.selector}` : "Screenshot failed",
            }],
            isError: true,
          };
        }
  
        screenshots.set(args.name, screenshot as string);
        server.notification({
          method: "notifications/resources/list_changed",
        });
  
        return {
          content: [
            {
              type: "text",
              text: `Screenshot '${args.name}' taken at ${width}x${height}`,
            } as TextContent,
            {
              type: "image",
              data: screenshot,
              mimeType: "image/png",
            } as ImageContent,
          ],
          isError: false,
        };
      }
  
      case "puppeteer_click":
        try {
          let selector: string | null = null;
          let btn: ElementHandle<Element> | null = null;
          if (args.text) {
            selector = `text/${args.text}`;
            btn = await page.waitForSelector(selector);
          } else if (args.aria_label) {
            selector = `button[aria-label="${args.aria_label}"]`;
            btn = await page.waitForSelector(selector);
          } else if (args.test_id) {
            selector = `[data-testid="${args.test_id}"]`;
            btn = await page.waitForSelector(selector);
          }
  
          await btn?.click();
  
          return {
            content: [{
              type: "text",
              text: `Clicked: ${selector}`,
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to click: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      case "puppeteer_fill":
        try {
          await page.waitForSelector(args.selector);
          await page.type(args.selector, args.value);
          return {
            content: [{
              type: "text",
              text: `Filled ${args.selector} with: ${args.value}`,
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to fill ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      case "puppeteer_select":
        try {
          await page.waitForSelector(args.selector);
          await page.select(args.selector, args.value);
          return {
            content: [{
              type: "text",
              text: `Selected ${args.selector} with: ${args.value}`,
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to select ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      case "puppeteer_hover":
        try {
          await page.waitForSelector(args.selector);
          await page.hover(args.selector);
          return {
            content: [{
              type: "text",
              text: `Hovered ${args.selector}`,
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to hover ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      case "puppeteer_evaluate":
        try {
          await page.evaluate(() => {
            window.mcpHelper = {
              logs: [],
              originalConsole: { ...console },
            };
  
            ['log', 'info', 'warn', 'error'].forEach(method => {
              (console as any)[method] = (...args: any[]) => {
                window.mcpHelper.logs.push(`[${method}] ${args.join(' ')}`);
                (window.mcpHelper.originalConsole as any)[method](...args);
              };
            } );
          } );
  
          const result = await page.evaluate( args.script );
  
          const logs = await page.evaluate(() => {
            Object.assign(console, window.mcpHelper.originalConsole);
            const logs = window.mcpHelper.logs;
            delete ( window as any).mcpHelper;
            return logs;
          });
  
          return {
            content: [
              {
                type: "text",
                text: `Execution result:\n${JSON.stringify(result, null, 2)}\n\nConsole output:\n${logs.join('\n')}`,
              },
            ],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Script execution failed: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${name}`,
          }],
          isError: true,
        };
    }
  }

  if (name === "mysql_query") {
    const sql = args?.sql as string;
    
    // Ensure query is read-only
    const normalizedSql = sql.trim().toLowerCase();
    if (!normalizedSql.startsWith('select ') && !normalizedSql.startsWith('show ') && !normalizedSql.startsWith('describe ')) {
      throw new Error('Only SELECT, SHOW, and DESCRIBE queries are allowed');
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(sql);
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
        isError: false,
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
  if (name === "yopmail_generate_email") {
    const email = await easyYopmail.getMail();
    return {
      content: [{ type: "text", text: JSON.stringify({ email }, null, 2) }],
      isError: false,
    };
  }
  if (name === "yopmail_read_inbox") {
    const { email } = args as { email: string };
    const inbox = await easyYopmail.getInbox(email);
    return {
      content: [{ type: "text", text: JSON.stringify(inbox, null, 2) }],
      isError: false,
    };
  }
  if (name === "yopmail_read_message") {
    const { email, messageId, format } = args as { 
      email: string;
      messageId: string;
      format: "TXT" | "HTML";
    };
    const message = await easyYopmail.readMessage(email, messageId, { 
      format: format === "TXT" ? "txt" : "html" 
    });
    return {
      content: [{ type: "text", text: JSON.stringify(message, null, 2) }],
      isError: false,
    };
  }
  throw new Error(`Unknown tool: ${name}`);

}

const server = new Server(
  {
    name: "gotit/test-automation",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);


// Setup request handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "console://logs",
      mimeType: "text/plain",
      name: "Browser console logs",
    },
    ...Array.from(screenshots.keys()).map(name => ({
      uri: `screenshot://${name}`,
      mimeType: "image/png",
      name: `Screenshot: ${name}`,
    })),
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();

  if (uri === "console://logs") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: consoleLogs.join("\n"),
      }],
    };
  }

  if (uri.startsWith("screenshot://")) {
    const name = uri.split("://")[1];
    const screenshot = screenshots.get(name);
    if (screenshot) {
      return {
        contents: [{
          uri,
          mimeType: "image/png",
          blob: screenshot,
        }],
      };
    }
  }

  throw new Error(`Resource not found: ${uri}`);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) =>
  handleToolCall(request.params.name, request.params.arguments ?? {})
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(console.error);

process.stdin.on("close", () => {
  console.error("Puppeteer MCP Server closed");
  server.close();
});
