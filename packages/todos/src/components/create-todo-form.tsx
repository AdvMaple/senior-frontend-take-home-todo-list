import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  createTodoSchema,
} from "@app/shared";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { useCreateTodo } from "../hooks/useCreateTodo";
import type { CreateTodoFormProps } from "./create-todo-form.types";

export function CreateTodoForm({
  assigneeId,
  assigneePicker,
  onCreated,
  className,
}: CreateTodoFormProps) {
  const [title, setTitle] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const { createTodo, isPending } = useCreateTodo();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Check assigneeId first since schema expects a string, not null
    if (!assigneeId) {
      errors.assigneeId = "Assignee is required";
    }

    const result = createTodoSchema.safeParse({
      title,
      assigneeId: assigneeId ?? "",
    });

    if (!result.success) {
      for (const issue of result.error.issues) {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setTitle(e.target.value);
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // At this point, validation guarantees assigneeId is not null
    if (assigneeId === null) {
      return;
    }

    createTodo({
      title: title.trim(),
      assigneeId,
    })
      .then(() => {
        setTitle("");
        setValidationErrors({});
        onCreated?.();
      })
      .catch(() => {
        // Error is handled by useCreateTodo hook (notify.error is called there)
      });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create Todo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={handleTitleChange}
              disabled={isPending}
              aria-invalid={Boolean(validationErrors.title)}
              aria-describedby={validationErrors.title ? "title-error" : undefined}
            />
            {validationErrors.title && (
              <div
                id="title-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {validationErrors.title}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Assignee</Label>
            <div className="flex flex-col gap-2">
              {assigneePicker}
              {validationErrors.assigneeId && (
                <div
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {validationErrors.assigneeId}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
