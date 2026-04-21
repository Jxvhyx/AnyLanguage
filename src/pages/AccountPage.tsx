import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function AccountPage() {
    const { profile, user } = useAuth();

    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // 🔹 Actualizar nombre
    const updateProfile = async () => {
        setLoading(true);
        setMessage("");

        const { error } = await supabase
            .from("profiles")
            .update({ full_name: fullName })
            .eq("id", user?.id);

        if (error) {
            setMessage("❌ Error updating profile");
        } else {
            setMessage("✅ Profile updated successfully");
        }

        setLoading(false);
    };

    // 🔹 Cambiar contraseña
    const updatePassword = async () => {
        if (!password) return;

        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            setMessage("❌ Error updating password");
        } else {
            setMessage("✅ Password updated successfully");
            setPassword("");
        }

        setLoading(false);
    };

    return (
        <DashboardLayout>
            <div className="animate-slide-up space-y-6">

                <h1 className="text-3xl font-display text-foreground">
                    ⚙️ My Account
                </h1>

                {/* 🔹 Profile Info */}
                <Card className="shadow-card border-0">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">

                        <div>
                            <label className="text-sm font-body">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-body">Email</label>
                            <input
                                type="text"
                                value={user?.email || ""}
                                disabled
                                className="w-full mt-1 p-2 border rounded-lg bg-muted"
                            />
                        </div>

                        <button
                            onClick={updateProfile}
                            disabled={loading}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                        >
                            Save Changes
                        </button>

                    </CardContent>
                </Card>

                {/* 🔹 Password */}
                <Card className="shadow-card border-0">
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">

                        <div>
                            <label className="text-sm font-body">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-lg"
                            />
                        </div>

                        <button
                            onClick={updatePassword}
                            disabled={loading}
                            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold"
                        >
                            Change Password
                        </button>

                    </CardContent>
                </Card>

                {/* 🔹 Feedback */}
                {message && (
                    <p className="text-sm font-body">{message}</p>
                )}

            </div>
        </DashboardLayout>
    );
}