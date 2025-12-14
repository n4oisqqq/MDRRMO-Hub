import { Link, useLocation } from "wouter";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title, showBack = false }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full h-[70px] flex items-center justify-between px-4 md:px-8"
      style={{
        background: "linear-gradient(135deg, #020964, #003375)",
        backdropFilter: "blur(15px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        borderBottom: "2px solid rgba(162, 255, 236, 0.17)",
      }}
      data-testid="header"
    >
      <div className="flex items-center gap-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-[#E3D095] hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        <div className="flex items-center gap-3">
          <Link href="/">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #7965C1, #f30059)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                animation: "pulse 2s infinite",
              }}
              data-testid="logo-mdrrmo"
            >
              <img
                src="https://res.cloudinary.com/dedcmctqk/image/upload/v1750079276/logome_h9snnx.webp"
                alt="MDRRMO"
                className="w-11 h-11 object-contain"
              />
            </div>
          </Link>

          <div className="hidden md:block">
            <h1
              className="text-lg md:text-xl font-extrabold tracking-wide"
              style={{
                color: "#E3D095",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              }}
              data-testid="text-header-title"
            >
              {title || "MDRRMO PIO DURAN"}
            </h1>
            <p className="text-xs text-[#E3D095]/70 hidden lg:block">
              File Inventory and Management System
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7965C1, #f30059)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
            data-testid="logo-lgu"
          >
            <img
              src="https://res.cloudinary.com/dedcmctqk/image/upload/v1753255299/PIODURAN_SEAL_riahyf.webp"
              alt="Pio Duran Seal"
              className="w-10 h-10 object-contain rounded-lg"
            />
          </div>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-[#E3D095]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(121, 101, 193, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(121, 101, 193, 0); }
          100% { box-shadow: 0 0 0 0 rgba(121, 101, 193, 0); }
        }
      `}</style>
    </header>
  );
}
