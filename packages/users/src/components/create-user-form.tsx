import {
  cn,
  createUserSchema,
  Input,
  Label,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@app/shared";
import { useRef, useState } from "react";
import { useCreateUser } from "../hooks/useCreateUser";
import type { CreateUserFormProps } from "./create-user-form.types";

const USERNAME_ERROR_ID = "username-error";
const RETRY_HINT_ID = "username-retry-hint";

function firstIssueMessage(input: { username: string }): string | null {
  const parsed = createUserSchema.safeParse(input);
  if (parsed.success) return null;
  return parsed.error.issues[0]?.message ?? "Username is invalid";
}

/** U-1/U-2/U-3/U-7: username form with inline validation and server feedback. */
export function CreateUserForm({ onCreated, className }: CreateUserFormProps) {
  const [username, setUsername] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    createUser,
    clearErrors,
    isPending,
    isSubmitDisabled,
    usernameError,
    retryHint,
  } = useCreateUser();

  const fieldError = validationError ?? usernameError;
  const describedByIds = [
    fieldError ? USERNAME_ERROR_ID : null,
    retryHint ? RETRY_HINT_ID : null,
  ]
    .filter((id): id is string => id !== null)
    .join(" ");

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();

    const message = firstIssueMessage({ username });
    setValidationError(message);
    if (message) {
      inputRef.current?.focus();
      return;
    }

    try {
      const user = await createUser({ username });
      setValidationError(null);
      setUsername("");
      onCreated?.(user);
    } catch {
      inputRef.current?.focus();
    }
  }

  function handleUsernameChange(value: string): void {
    setUsername(value);
    setValidationError(null);
    clearErrors();
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Create user</CardTitle>
        <CardDescription>Create a user by username.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              ref={inputRef}
              id="username"
              name="username"
              value={username}
              onChange={(event) => {
                handleUsernameChange(event.target.value);
              }}
              aria-invalid={fieldError !== null}
              aria-describedby={describedByIds || undefined}
              autoComplete="off"
              required
            />
            {fieldError ? (
              <p
                id={USERNAME_ERROR_ID}
                role="alert"
                className="text-sm text-destructive"
              >
                {fieldError}
              </p>
            ) : null}
            {retryHint ? (
              <p
                id={RETRY_HINT_ID}
                role="alert"
                className="text-sm text-destructive"
              >
                {retryHint}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={isSubmitDisabled}>
            Create user
          </Button>
          {isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              Creating user...
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
