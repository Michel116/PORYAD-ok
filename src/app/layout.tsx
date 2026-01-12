
'use client';
import type { Metadata } from 'next';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from "@/components/main-nav";
import { Logo } from "@/components/logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft, LogOut } from "lucide-react";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ClientProviders } from '@/components/client-providers';
import { Badge } from '@/components/ui/badge';
import { TerminalsProvider } from '@/context/terminals-context';


function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
      setYear(new Date().getFullYear());
    }, []);

    return (
        <ClientProviders>
            <TerminalsProvider>
            <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                <div className="hidden border-r bg-card md:block">
                    <div className="flex h-full max-h-screen flex-col gap-2">
                        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                            <Logo />
                        </div>
                        <div className="flex-1 overflow-y-auto py-4">
                            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                                <MainNav />
                            </nav>
                        </div>
                        <div className="mt-auto p-4 border-t">
                            <Link href="/login">
                                <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-transparent hover:text-destructive/90">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Выйти
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 md:hidden"
                                >
                                    <PanelLeft className="h-5 w-5" />
                                    <span className="sr-only">Переключить меню навигации</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex flex-col p-0">
                                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 mb-4">
                                    <Logo />
                                </div>
                                <div className="flex-1 overflow-y-auto py-4">
                                    <nav className="grid gap-2 text-lg font-medium px-4">
                                        <MainNav />
                                    </nav>
                                </div>
                                <div className="mt-auto p-4 border-t">
                                     <Link href="/login">
                                        <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-transparent hover:text-destructive/90">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Выйти
                                        </Button>
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </header>
                    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40 relative">
                        <div className="flex-1">
                            {children}
                        </div>
                         <footer className="text-center text-xs text-muted-foreground pt-4">
                            <p>© {year} Порядок. Все права защищены.</p>
                            <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground pt-4 relative h-8">
                                <span>Версия 1.2.29</span>
                                <Badge variant="outline" className="border-primary/50 text-primary px-1.5 py-0.5 text-[10px] font-bold tracking-wider">
                                BETA
                                </Badge>
                            </div>
                        </footer>
                    </main>
                </div>
            </div>
            </TerminalsProvider>
        </ClientProviders>
    );
}

function AppWithConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <div className="bg-login-gradient">{children}</div>;
  }

  return <AppLayoutContent>{children}</AppLayoutContent>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>Порядок</title>
      </head>
      <body className="font-body antialiased">
          <AppWithConditionalLayout>{children}</AppWithConditionalLayout>
        <Toaster />
      </body>
    </html>
  );
}
