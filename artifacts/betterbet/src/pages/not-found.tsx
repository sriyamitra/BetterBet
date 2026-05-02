import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout showNav={false}>
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-destructive/10 p-6 rounded-full mb-6 animate-bounce-sm">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">This page doesn't exist.</p>
        <Link href="/">
          <Button size="lg" className="h-12 font-bold shadow-lg hover-elevate">Return Home</Button>
        </Link>
      </div>
    </Layout>
  );
}
