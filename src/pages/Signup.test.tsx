import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "./Signup";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  toast: (args: unknown) => toastMock(args),
  useToast: () => ({ toast: toastMock, toasts: [], dismiss: vi.fn() }),
}));

const signUpMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { signUp: (args: unknown) => signUpMock(args) },
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

function renderSignup() {
  return render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );
}

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jane@example.com" } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
}

describe("Signup flow", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    toastMock.mockClear();
    signUpMock.mockReset();
  });

  it("shows success toast and navigates to / after account creation", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    renderSignup();
    fillAndSubmit();

    await waitFor(() => expect(signUpMock).toHaveBeenCalled());
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Welcome to StudyFlow!",
          description: "Your account has been created.",
        })
      );
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("navigates to / even when no user object is returned", async () => {
    signUpMock.mockResolvedValue({ data: { user: null }, error: null });
    renderSignup();
    fillAndSubmit();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
  });

  it("does not navigate on signup error", async () => {
    signUpMock.mockResolvedValue({ data: { user: null }, error: { message: "bad" } });
    renderSignup();
    fillAndSubmit();

    await waitFor(() => expect(signUpMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
