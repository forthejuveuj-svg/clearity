import "./globals.css";

export const metadata = {
  title: "Clearity — See Your Mind",
  description: "AI-powered cognitive platform that mirrors your thinking process",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
