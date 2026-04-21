import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, GraduationCap, Users, Baby, Shield } from "lucide-react";

type AppRole = "student" | "parent" | "teacher";

const roles: { value: AppRole; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "student", label: "Student", icon: <GraduationCap className="w-6 h-6" />, color: "bg-info text-info-foreground" },
  { value: "parent", label: "Parent", icon: <Baby className="w-6 h-6" />, color: "bg-success text-success-foreground" },
  { value: "teacher", label: "Teacher", icon: <Users className="w-6 h-6" />, color: "bg-accent text-accent-foreground" },
];


export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length === 0 || fullName.length > 100) {
      toast({ variant: "destructive", title: "Invalid name" });
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password, fullName.trim(), role);
toast({ title: "Account created! 🎉", description: "Welcome to AnyLanguage!" });
navigate("/login");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-bounce-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-fun flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-display text-foreground">AnyLanguage</h1>
          </div>
        </div>

        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-display text-foreground">Join the Fun!</h2>
            <p className="text-muted-foreground">Create your account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>

              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-body font-bold ${
                        role === r.value
                          ? `${r.color} border-transparent scale-105`
                          : "bg-card border-border hover:border-primary/30"
                      }`}
                    >
                      {r.icon}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full text-lg py-6 font-bold" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Start Learning! 🌟"}
              </Button>
            </form>
            <p className="text-center mt-6 text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
