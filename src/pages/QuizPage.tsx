import DashboardLayout from "@/components/DashboardLayout";
import { dictionary } from "@/data/dictionary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { Trophy, CircleCheck, CircleX } from "lucide-react";
import { Link } from "react-router-dom";

function shuffleArray<T>(array: T[]) {
    return [...array].sort(() => Math.random() - 0.5);
}

export default function QuizPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    const currentWord = dictionary[currentIndex];

    const options = useMemo(() => {
        if (!currentWord) return [];

        const wrongAnswers = shuffleArray(
            dictionary.filter((word) => word.id !== currentWord.id)
        )
            .slice(0, 2)
            .map((word) => word.english);

        return shuffleArray([currentWord.english, ...wrongAnswers]);
    }, [currentWord]);

    const handleAnswer = (answer: string) => {
        if (selectedAnswer) return;

        setSelectedAnswer(answer);

        if (answer === currentWord.english) {
            setScore((prev) => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 < dictionary.length) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedAnswer(null);
        } else {
            setShowResult(true);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-display text-foreground">🎮 Quiz</h1>
                    <p className="text-muted-foreground font-body">
                        Elige la traducción correcta en inglés.
                    </p>
                </div>

                {showResult ? (
                    <Card className="shadow-card border-0">
                        <CardHeader>
                            <CardTitle className="font-display flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Resultado final
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg font-body">
                                Obtuviste <span className="font-bold">{score}</span> de{" "}
                                <span className="font-bold">{dictionary.length}</span> respuestas correctas.
                            </p>

                            <button
                                onClick={handleRestart}
                                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-body font-bold hover:opacity-90 transition-opacity"
                            >
                                Jugar otra vez
                            </button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="shadow-card border-0">
                        <CardHeader>
                            <CardTitle className="font-display">
                                Pregunta {currentIndex + 1} de {dictionary.length}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-muted-foreground font-body">
                                    ¿Cómo se dice esta palabra en inglés?
                                </p>
                                <h2 className="text-2xl font-display text-foreground">
                                    {currentWord.spanish}
                                </h2>
                            </div>

                            <div className="grid gap-3">
                                {options.map((option) => {
                                    const isCorrect = option === currentWord.english;
                                    const isSelected = selectedAnswer === option;

                                    let buttonClass =
                                        "w-full text-left px-4 py-3 rounded-xl border font-body font-semibold transition-all";

                                    if (!selectedAnswer) {
                                        buttonClass += " bg-card hover:bg-muted";
                                    } else if (isCorrect) {
                                        buttonClass += " bg-green-100 border-green-500 text-green-700";
                                    } else if (isSelected) {
                                        buttonClass += " bg-red-100 border-red-500 text-red-700";
                                    } else {
                                        buttonClass += " bg-card opacity-70";
                                    }

                                    return (
                                        <button
                                            key={option}
                                            onClick={() => handleAnswer(option)}
                                            disabled={!!selectedAnswer}
                                            className={buttonClass}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>
                                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                                </span>
                                                {selectedAnswer && isCorrect && (
                                                    <CircleCheck className="w-5 h-5" />
                                                )}
                                                {selectedAnswer && isSelected && !isCorrect && (
                                                    <CircleX className="w-5 h-5" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedAnswer && (
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm text-muted-foreground font-body">
                                        Puntaje actual: <span className="font-bold">{score}</span>
                                    </p>

                                    <button
                                        onClick={handleNext}
                                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-body font-bold hover:opacity-90 transition-opacity"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}