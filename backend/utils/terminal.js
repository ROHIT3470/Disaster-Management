const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function colorize(color, text) {
  return useColor ? `${colors[color]}${text}${colors.reset}` : text;
}

function writeLine(prefix, message, color = "reset") {
  console.log(`${colorize(color, prefix)} ${message}`);
}

export function printStartupBanner() {
  const line = "============================================================";

  console.log("");
  console.log(colorize("cyan", line));
  console.log(colorize("bold", "  DISASTER MANAGEMENT COMMAND API"));
  console.log(colorize("dim", "  Secure emergency intelligence and response services"));
  console.log(colorize("cyan", line));
}

export function logSuccess(message) {
  writeLine("[ OK ]", message, "green");
}

export function logInfo(message) {
  writeLine("[ .. ]", message, "cyan");
}

export function logWarning(message) {
  writeLine("[WARN]", message, "yellow");
}

export function logError(message) {
  writeLine("[FAIL]", message, "red");
}

export function printStartupSummary({ port, emailConfigured }) {
  console.log("");
  console.log(colorize("bold", "  SERVICES"));
  logSuccess(`HTTP API       http://localhost:${port}`);
  logSuccess("Health check   /api/health");
  logSuccess(`Email delivery ${emailConfigured ? "configured" : "disabled"}`);

  if (!emailConfigured) {
    logWarning("Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD in backend/.env");
  }

  console.log("");
}

export function printShutdownMessage(signal) {
  console.log("");
  logInfo(`Received ${signal}; shutting down gracefully...`);
}
