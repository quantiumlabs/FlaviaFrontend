"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader"; // shadcn component

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
    } else {
      router.push("/map");
    }
  }, [router]);

  // Render a loading indicator while redirecting
  return (
  <div>
    <h1 className="flex 12px">Carregando...</h1>
    <div className="flex items-center justify-center h-screen">
      <Loader />
    </div>
  </div>
  );
}