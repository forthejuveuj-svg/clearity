import "./globals.css";

export const metadata = {
  title: "Clearity — See Your Mind",
  description: "AI-powered cognitive platform that mirrors your thinking process",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
