import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "../SignUpForm";
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

const mockSignUp = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as any).mockReturnValue({
    signUp: mockSignUp,
    isLoading: false,
  });
});

afterEach(() => {
  cleanup();
});

// --- Rendering ---

test("renders email input", () => {
  render(<SignUpForm />);
  expect(screen.getByLabelText("Email")).toBeDefined();
});

test("renders password input", () => {
  render(<SignUpForm />);
  expect(screen.getByLabelText("Password")).toBeDefined();
});

test("renders confirm password input", () => {
  render(<SignUpForm />);
  expect(screen.getByLabelText("Confirm Password")).toBeDefined();
});

test("renders submit button with Sign Up label", () => {
  render(<SignUpForm />);
  expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
});

test("shows password minimum length hint", () => {
  render(<SignUpForm />);
  expect(
    screen.getByText("Must be at least 8 characters long")
  ).toBeDefined();
});

test("does not show error message on initial render", () => {
  render(<SignUpForm />);
  expect(screen.queryByText("Passwords do not match")).toBeNull();
});

// --- Happy path ---

test("calls signUp with email and password when passwords match", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  const user = userEvent.setup();

  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "password123");
});

test("calls onSuccess callback when sign up succeeds", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  const onSuccess = vi.fn();
  const user = userEvent.setup();

  render(<SignUpForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
});

// --- Validation ---

test("shows passwords do not match error when passwords differ", async () => {
  const user = userEvent.setup();

  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "differentpassword");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(screen.getByText("Passwords do not match")).toBeDefined();
});

test("does not call signUp when passwords do not match", async () => {
  const user = userEvent.setup();

  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "mismatch");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(mockSignUp).not.toHaveBeenCalled();
});

test("does not call onSuccess when passwords do not match", async () => {
  const onSuccess = vi.fn();
  const user = userEvent.setup();

  render(<SignUpForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "mismatch");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(onSuccess).not.toHaveBeenCalled();
});

// --- Error states ---

test("shows error message returned from signUp on failure", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already in use" });
  const user = userEvent.setup();

  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "existing@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  await waitFor(() =>
    expect(screen.getByText("Email already in use")).toBeDefined()
  );
});

test("shows fallback error message when error field is absent", async () => {
  mockSignUp.mockResolvedValue({ success: false });
  const user = userEvent.setup();

  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  await waitFor(() =>
    expect(screen.getByText("Failed to sign up")).toBeDefined()
  );
});

test("does not call onSuccess when sign up fails", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already in use" });
  const onSuccess = vi.fn();
  const user = userEvent.setup();

  render(<SignUpForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText("Email"), "existing@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  await waitFor(() => screen.getByText("Email already in use"));
  expect(onSuccess).not.toHaveBeenCalled();
});

test("clears previous error before a new submission", async () => {
  mockSignUp
    .mockResolvedValueOnce({ success: false, error: "First error" })
    .mockResolvedValueOnce({ success: true });
  const user = userEvent.setup();

  render(<SignUpForm />);

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  await waitFor(() => expect(screen.getByText("First error")).toBeDefined());

  await user.click(screen.getByRole("button", { name: "Sign Up" }));

  await waitFor(() => expect(screen.queryByText("First error")).toBeNull());
});

// --- Loading state ---

test("shows Creating account… label when isLoading is true", () => {
  (useAuth as any).mockReturnValue({ signUp: mockSignUp, isLoading: true });

  render(<SignUpForm />);

  expect(
    screen.getByRole("button", { name: "Creating account..." })
  ).toBeDefined();
});

test("disables email input while loading", () => {
  (useAuth as any).mockReturnValue({ signUp: mockSignUp, isLoading: true });

  render(<SignUpForm />);

  expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
});

test("disables password input while loading", () => {
  (useAuth as any).mockReturnValue({ signUp: mockSignUp, isLoading: true });

  render(<SignUpForm />);

  expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);
});

test("disables confirm password input while loading", () => {
  (useAuth as any).mockReturnValue({ signUp: mockSignUp, isLoading: true });

  render(<SignUpForm />);

  expect(screen.getByLabelText("Confirm Password")).toHaveProperty(
    "disabled",
    true
  );
});

test("disables submit button while loading", () => {
  (useAuth as any).mockReturnValue({ signUp: mockSignUp, isLoading: true });

  render(<SignUpForm />);

  expect(screen.getByRole("button")).toHaveProperty("disabled", true);
});

test("all inputs and button are enabled when not loading", () => {
  render(<SignUpForm />);

  expect(screen.getByLabelText("Email")).toHaveProperty("disabled", false);
  expect(screen.getByLabelText("Password")).toHaveProperty("disabled", false);
  expect(screen.getByLabelText("Confirm Password")).toHaveProperty(
    "disabled",
    false
  );
  expect(screen.getByRole("button")).toHaveProperty("disabled", false);
});
