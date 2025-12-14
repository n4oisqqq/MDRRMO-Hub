import { Link } from "wouter";
import { ArrowRight, Package, Calendar, Users, FileText, Image, Map, Globe } from "lucide-react";
import type { DashboardModule } from "@shared/schema";

const iconMap: Record<string, any> = {
  package: Package,
  calendar: Calendar,
  users: Users,
  "file-text": FileText,
  image: Image,
  map: Map,
  globe: Globe,
};

interface DashboardCardProps {
  module: DashboardModule;
  index: number;
}

export function DashboardCard({ module, index }: DashboardCardProps) {
  const Icon = iconMap[module.icon] || Package;

  return (
    <Link href={module.route}>
      <div
        className="group relative rounded-3xl p-6 cursor-pointer transition-all duration-300 ease-out overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${module.color}20, ${module.color}10)`,
          backdropFilter: "blur(25px)",
          border: `1px solid ${module.color}40`,
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
          animationDelay: `${index * 100}ms`
        }}
        data-testid={`card-module-${module.id}`}
      >
        <div 
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${module.color}30, ${module.color}15)`,
            boxShadow: `0 0 40px ${module.color}30`
          }}
        />

        <div 
          className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${module.color}, transparent 70%)`
          }}
        />

        <div className="relative z-10">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${module.color}, ${module.color}CC)`,
              boxShadow: `0 8px 24px ${module.color}40`
            }}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>

          <h3 
            className="text-xl font-extrabold mb-2 tracking-wide"
            style={{ 
              color: "#E3D095",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
            }}
            data-testid={`text-module-title-${module.id}`}
          >
            {module.title}
          </h3>

          <p 
            className="text-sm mb-6 leading-relaxed"
            style={{ color: "rgba(227, 208, 149, 0.75)" }}
            data-testid={`text-module-desc-${module.id}`}
          >
            {module.description}
          </p>

          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 group-hover:gap-3"
            style={{
              background: module.color,
              color: "white",
              boxShadow: `0 4px 16px ${module.color}50`
            }}
            data-testid={`button-proceed-${module.id}`}
          >
            PROCEED
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        <div 
          className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-10"
          style={{ background: module.color }}
        />
      </div>
    </Link>
  );
}
