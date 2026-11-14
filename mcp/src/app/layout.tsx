import "./globals.css";

export const metadata = {
  title: "allsxxing Skills MCP",
  description:
    "One registry for every skill @allsxxing runs across Claude, Grok, Gemini, Perplexity and ChatGPT. Connect an app in a minute.",
  icons: { icon: "/brand/xx-circle.gif" },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
