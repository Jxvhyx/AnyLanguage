import { useState } from "react";
import { dictionary } from "../data/dictionary";

export default function Dictionary() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("todas");
    const [playingId, setPlayingId] = useState<string | null>(null);

    const speak = (text: string, id: string) => {
        setPlayingId(id);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";

        utterance.onend = () => {
            setPlayingId(null);
        };

        speechSynthesis.speak(utterance);
    };

    const filtered = dictionary.filter((word) => {
        const matchesSearch =
            word.spanish.toLowerCase().includes(search.toLowerCase()) ||
            word.english.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            category === "todas" || word.category === category;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-display text-foreground">
                📚 Diccionario
            </h1>

            <input
                type="text"
                placeholder="Buscar palabra..."
                className="w-full px-4 py-2 rounded-xl border bg-background shadow-sm"
            />

            { }
            <div className="flex gap-2 flex-wrap">
                {["todas", "animales", "comida", "hogar"].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-xl font-body font-semibold transition ${category === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map((word) => (
                    <div className="bg-card rounded-xl shadow-card border-0 hover:shadow-elevated transition-all p-4">
                        <img
                            src={word.image}
                            alt={word.spanish}
                            className="w-full h-36 object-cover rounded-lg mb-3"
                        />
                        <p className="font-semibold">
                            {word.spanish.charAt(0).toUpperCase() + word.spanish.slice(1)}
                        </p>
                        
                        <p className="text-gray-500 mb-2">
                            {word.english.charAt(0).toUpperCase() + word.english.slice(1)}
                        </p>
                        <button
                            onClick={() => speak(word.english, word.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${playingId === word.id
                                ? "bg-green-500 text-white scale-105 animate-pulse"
                                : "bg-primary text-primary-foreground hover:opacity-90"
                                }`}
                        >
                            🔊 Escuchar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}