export const metadata = {
  title: "ALL SEEING EYES Skills MCP",
  description: "Every skill GJ (@allsxxing) builds, on every AI app, from one registry.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0b0f", color: "#e8e8ee", fontFamily: "ui-monospace, Menlo, monospace" }}>
        {children}
      </body>
    </html>
  );
}
