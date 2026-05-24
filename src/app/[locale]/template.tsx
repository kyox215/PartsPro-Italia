import { PageTransition } from "@/components/motion/page-transition";

export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PageTransition>{children}</PageTransition>;
}
