import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { DashboardCard } from "@/components/dashboard-card";
import type { DashboardModule } from "@shared/schema";

const modules: DashboardModule[] = [
  {
    id: "supply-inventory",
    title: "Supply Inventory",
    description:
      "Track equipment, ofice supplies, and monitor stock levels in real-time for efficient disaster response.",
    icon: "package",
    color: "#f570ff",
    route: "/inventory",
  },
  {
    id: "calendar",
    title: "Calendar of Activities",
    description:
      "Schedule drills, meetings, and emergency response training. Stay organized with event management.",
    icon: "calendar",
    color: "#45B7D1",
    route: "/calendar",
  },
  {
    id: "contacts",
    title: "Contact List",
    description:
      "Access emergency responder contacts, agency directories, and key personnel information instantly.",
    icon: "users",
    color: "#96CEB4",
    route: "/contacts",
  },
  {
    id: "documents",
    title: "Document",
    description:
      "Manage official documents, bulletins, resolutions, and BDRRMP files in an organized file system.",
    icon: "file-text",
    color: "#FFEAA7",
    route: "/documents",
  },
  {
    id: "gallery",
    title: "Photo Gallery",
    description:
      "Browse documentation photos from emergency responses, drills, and community activities.",
    icon: "image",
    color: "#DDA0DD",
    route: "/gallery",
  },
  {
    id: "maps",
    title: "Maps",
    description:
      "View interactive hazard maps, evacuation routes, and asset locations for disaster preparedness.",
    icon: "map",
    color: "#FFB3BA",
    route: "/maps",
  },
  {
    id: "panorama",
    title: "Panorama Map",
    description:
      "Explore 360-degree panoramic images and immersive views of locations for virtual site assessment.",
    icon: "globe",
    color: "#87CEEB",
    route: "/panorama",
  },
];

export default function Dashboard() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <BackgroundPattern />
      <Header />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
         

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className="transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <DashboardCard key={module.id} module={module} index={index} />
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
