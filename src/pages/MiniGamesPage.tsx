import DashboardLayout from "@/components/DashboardLayout";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function MiniGamesPage() {
  return (
    <DashboardLayout>
      <div className="animate-slide-up space-y-6">
        <Link
          to="/minigames"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Back to Minigames
        </Link>
        <h1 className="text-3xl font-display">🎮 Minigames</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Link to="/quiz">
            <Card className="shadow-card hover:shadow-elevated transition cursor-pointer">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold">🧠 Quiz</h2>
                <p className="text-muted-foreground">
                  Traduce palabras del español al inglés
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/image-game">
            <Card className="shadow-card hover:shadow-elevated transition cursor-pointer">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold">🖼️ Imagen</h2>
                <p className="text-muted-foreground">
                  Adivina la palabra viendo la imagen
                </p>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </DashboardLayout>
  );
}