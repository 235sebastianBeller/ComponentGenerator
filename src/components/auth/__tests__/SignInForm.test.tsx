import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "../SignInForm";
import { useAuth } from "@/hooks/use-auth";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, type }: any) => (
    <button disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ className, ...props }: any) => <input {...props} />,
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

const mockSignIn = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as any).mockReturnValue({
    signIn: mockSignIn,
    isLoading: false,
  });
});

afterEach(() => {
  cleanup();
});

// --- Rendering ---

test("renders email input", () => {
  render(<SignInForm />);
  expect(screen.getByLabelText("Email")).toBeDefined();
});

test("renders password input", () => {
  render(<SignInForm />);
  expect(screen.getByLabelText("Password")).toBeDefined();
});

test("renders submit button with Sign In label", () => {
  render(<SignInForm />);
  expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
});

test("does not show error message on initial render", () => {
  render(<SignInForm />);
  expect(screen.queryByRole("alert")).toBeNull();
});

// --- Happy path ---

test("calls signIn with email and password on submit", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  const user = userEvent.setup();

  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
});

test("calls onSuccess callback when sign in succeeds", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  const onSuccess = vi.fn();
  const user = userEvent.setup();

  render(<SignInForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
});

test("does not show error after successful sign in", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  const user = userEvent.setup();

  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() =>
    expect(screen.queryByText("Failed to sign in")).toBeNull()
  );
});

// --- Error states ---

test("shows error message returned from signIn on failure", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  const user = userEvent.setup();

  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "wrongpassword");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() =>
    expect(screen.getByText("Invalid credentials")).toBeDefined()
  );
});

test("shows fallback error message when error field is absent", async () => {
  mockSignIn.mockResolvedValue({ success: false });
  const user = userEvent.setup();

  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() =>
    expect(screen.getByText("Failed to sign in")).toBeDefined()
  );
});

test("does not call onSuccess when sign in fails", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  const onSuccess = vi.fn();
  const user = userEvent.setup();

  render(<SignInForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "wrongpassword");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() => screen.getByText("Invalid credentials"));
  expect(onSuccess).not.toHaveBeenCalled();
});

test("clears previous error before a new submission", async () => {
  mockSignIn
    .mockResolvedValueOnce({ success: false, error: "First error" })
    .mockResolvedValueOnce({ success: true });
  const user = userEvent.setup();

  render(<SignInForm />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "badpassword");
  await user.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() => expect(screen.getByText("First error")).toBeDefined());

  await user.click(screen.getByRole("button", { name: "Sign In" }));

  await waitFor(() => expect(screen.queryByText("First error")).toBeNull());
});

// --- Loading state ---

test("shows Signing in… label when isLoading is true", () => {
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, isLoading: true });

  render(<SignInForm />);

  expect(screen.getByRole("button", { name: "Signing in..." })).toBeDefined();
});

test("disables email input while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, isLoading: true });

  render(<SignInForm />);

  expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
});

test("disables password input while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, isLoading: true });

  render(<SignInForm />);

  expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);
});

test("disables submit button while loading", () => {
  (useAuth as any).mockReturnValue({ signIn: mockSignIn, isLoading: true });

  render(<SignInForm />);

  expect(screen.getByRole("button")).toHaveProperty("disabled", true);
});

test("inputs are enabled when not loading", () => {
  render(<SignInForm />);

  expect(screen.getByLabelText("Email")).toHaveProperty("disabled", false);
  expect(screen.getByLabelText("Password")).toHaveProperty("disabled", false);
  expect(screen.getByRole("button")).toHaveProperty("disabled", false);
});
