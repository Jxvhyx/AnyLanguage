import { describe, expect, it } from "vitest";
import {
  getUserRole,
  canViewChildProgress,
  hasPermission,
  type User,
} from "../lib/user";

describe("Módulo Usuario", () => {
  it("debe retornar correctamente el rol del usuario", () => {
    const user: User = {
      id: "1",
      name: "Juan",
      role: "student",
    };

    expect(getUserRole(user)).toBe("student");
  });

  it("debe permitir a un parent ver el progreso de su hijo", () => {
    expect(canViewChildProgress("parent")).toBe(true);
  });

  it("no debe permitir a un student crear actividades", () => {
    expect(hasPermission("student", "createActivity")).toBe(false);
  });
});