import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./useAuth";

describe("AuthProvider + Supabase (Integration)", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  const createTestUser = () => ({
    email: `test_${Date.now()}@mail.com`,
    password: "123456",
    fullName: "Test User",
    role: "student" as const,
  });

  it("debe registrar usuario correctamente", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const userData = createTestUser();

    await act(async () => {
      await result.current.signUp(
        userData.email,
        userData.password,
        userData.fullName,
        userData.role
      );
    });

    // Si no lanza error, el test pasa
    expect(true).toBe(true);
  });

  it("debe fallar con email inválido", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    let errorCaught = false;

    await act(async () => {
      try {
        await result.current.signUp(
          "correo-invalido",
          "123456",
          "Test",
          "student"
        );
      } catch (error) {
        errorCaught = true;
      }
    });

    expect(errorCaught).toBe(true);
  });

  it("debe iniciar sesión correctamente", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const userData = createTestUser();

    // Primero registrar
    await act(async () => {
      await result.current.signUp(
        userData.email,
        userData.password,
        userData.fullName,
        userData.role
      );
    });

    // Luego login
    await act(async () => {
      await result.current.signIn(userData.email, userData.password);
    });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });
  });

  it("debe fallar con password incorrecto", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const userData = createTestUser();

    await act(async () => {
      await result.current.signUp(
        userData.email,
        userData.password,
        userData.fullName,
        userData.role
      );
    });

    let errorCaught = false;

    await act(async () => {
      try {
        await result.current.signIn(userData.email, "wrongpassword");
      } catch (error) {
        errorCaught = true;
      }
    });

    expect(errorCaught).toBe(true);
  });

  it("debe cerrar sesión correctamente", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const userData = createTestUser();

    await act(async () => {
      await result.current.signUp(
        userData.email,
        userData.password,
        userData.fullName,
        userData.role
      );
    });

    await act(async () => {
      await result.current.signIn(userData.email, userData.password);
    });

    await act(async () => {
      await result.current.signOut();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });
});