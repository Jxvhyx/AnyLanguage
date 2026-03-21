import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, GraduationCap, Users, BarChart3, Star, BookOpen } from "lucide-react";
import logo from "@/assets/logo.png";

const features = [
  { icon: BookOpen, title: "Interactive Lessons", desc: "Fun, engaging lessons designed for children", color: "bg-primary/10 text-primary" },
  { icon: GraduationCap, title: "Practice Exercises", desc: "Multiple exercise types to reinforce learning", color: "bg-secondary/10 text-secondary" },
  { icon: BarChart3, title: "Track Progress", desc: "Parents and teachers can monitor progress", color: "bg-info/10 text-info" },
  { icon: Users, title: "Role-Based Access", desc: "Dashboards for students, parents, teachers & admins", color: "bg-accent/10 text-accent" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={logo} alt="AnyLanguage logo" className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-2xl font-display text-foreground">AnyLanguage</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" className="font-bold">Sign In</Button></Link>
          <Link to="/register"><Button className="font-bold">Get Started</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <div className="animate-bounce-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-body font-bold text-sm mb-6">
            <Sparkles className="w-4 h-4" /> Learn English the Fun Way!
          </div>
          <h1 className="text-5xl md:text-7xl font-display text-foreground mb-6 leading-tight">
            English Learning<br />Made <span className="text-primary">Magical</span> ✨
          </h1>
          <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto mb-10">
            A playful, interactive platform where children learn English through engaging lessons,
            fun exercises, and real-time progress tracking.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6 font-bold rounded-2xl">
                Start Learning Free 🚀
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 font-bold rounded-2xl">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-display text-center text-foreground mb-12">
          Why Kids Love <span className="text-primary">AnyLanguage</span> <Star className="inline w-7 h-7 text-accent" />
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display text-card-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <div className="gradient-fun rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-display text-primary-foreground mb-4">Ready to Start Learning?</h2>
          <p className="text-lg text-primary-foreground/80 font-body mb-8">Join thousands of children learning English in a fun, interactive way!</p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 font-bold rounded-2xl">
              Create Free Account ✨
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-muted-foreground font-body border-t border-border">
        <p>© {new Date().getFullYear()} AnyLanguage. Learning English, one smile at a time. 😊</p>
      </footer>
    </div>
  );
}
