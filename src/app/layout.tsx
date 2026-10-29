import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ultramarathoning 101 Research",
  description:
    "Plain-English summaries of the latest ultramarathon research, with evidence ratings. Not medical advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
