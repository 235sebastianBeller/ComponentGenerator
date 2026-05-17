import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthDialog } from "../AuthDialog";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: any) => (
    <p data-testid="dialog-description">{children}</p>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("../SignInForm", () => ({
  SignInForm: ({ onSuccess }: any) => (
    <div data-testid="sign-in-form">
      <button data-testid="sign-in-success" onClick={onSuccess}>
        Mock Sign In Success
      </button>
    </div>
  ),
}));

vi.mock("../SignUpForm", () => ({
  SignUpForm: ({ onSuccess }: any) => (
    <div data-testid="sign-up-form">
      <button data-testid="sign-up-success" onClick={onSuccess}>
        Mock Sign Up Success
      </button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("does not render dialog content when closed", () => {
  render(<AuthDialog open={false} onOpenChange={vi.fn()} />);
  expect(screen.queryByTestId("dialog")).toBeNull();
});

test("renders dialog when open", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
  expect(screen.getByTestId("dialog")).toBeDefined();
});

test("shows sign in title by default", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
  expect(screen.getByTestId("dialog-title").textContent).toBe("Welcome back");
});

test("shows sign in description by default", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
  expect(screen.getByTestId("dialog-description").textContent).toContain(
    "Sign in to your account"
  );
});

test("shows sign up title when defaultMode is signup", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />);
  expect(screen.getByTestId("dialog-title").textContent).toBe(
    "Create an account"
  );
});

test("shows sign up description when defaultMode is signup", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />);
  expect(screen.getByTestId("dialog-description").textContent).toContain(
    "Sign up to start"
  );
});

test("renders SignInForm in signin mode", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
  expect(screen.getByTestId("sign-in-form")).toBeDefined();
  expect(screen.queryByTestId("sign-up-form")).toBeNull();
});

test("renders SignUpForm in signup mode", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />);
  expect(screen.getByTestId("sign-up-form")).toBeDefined();
  expect(screen.queryByTestId("sign-in-form")).toBeNull();
});

test("shows link to switch to signup when in signin mode", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
  expect(screen.getByText("Don't have an account?")).toBeDefined();
  expect(screen.getByRole("button", { name: "Sign up" })).toBeDefined();
});

test("shows link to switch to signin when in signup mode", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />);
  expect(screen.getByText("Already have an account?")).toBeDefined();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
});

test("switches to signup mode when sign up link is clicked", async () => {
  const user = userEvent.setup();
  render(<AuthDialog open={true} onOpenChange={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(screen.getByTestId("sign-up-form")).toBeDefined();
  expect(screen.getByTestId("dialog-title").textContent).toBe(
    "Create an account"
  );
});

test("switches to signin mode when sign in link is clicked", async () => {
  const user = userEvent.setup();
  render(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
  );

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(screen.getByTestId("sign-in-form")).toBeDefined();
  expect(screen.getByTestId("dialog-title").textContent).toBe("Welcome back");
});

test("calls onOpenChange(false) when sign in succeeds", async () => {
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  render(<AuthDialog open={true} onOpenChange={onOpenChange} />);

  await user.click(screen.getByTestId("sign-in-success"));

  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("calls onOpenChange(false) when sign up succeeds", async () => {
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  render(
    <AuthDialog open={true} onOpenChange={onOpenChange} defaultMode="signup" />
  );

  await user.click(screen.getByTestId("sign-up-success"));

  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("resets to signin mode when defaultMode prop changes to signin", () => {
  const { rerender } = render(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
  );

  expect(screen.getByTestId("dialog-title").textContent).toBe(
    "Create an account"
  );

  rerender(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signin" />);

  expect(screen.getByTestId("dialog-title").textContent).toBe("Welcome back");
});

test("resets to signup mode when defaultMode prop changes to signup", () => {
  const { rerender } = render(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signin" />
  );

  expect(screen.getByTestId("dialog-title").textContent).toBe("Welcome back");

  rerender(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
  );

  expect(screen.getByTestId("dialog-title").textContent).toBe(
    "Create an account"
  );
});
