import { PAGE_SIZES, TODO_SORTS } from "@app/shared";
import { renderWithProviders } from "@app/shared/test";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TodoListControls } from "./todo-list-controls";

describe("TodoListControls", () => {
  it("T-11: sort change delegates the reset to onSortChange", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const onPageChange = vi.fn();

    renderWithProviders(
      <TodoListControls
        page={3}
        pageSize={10}
        sort="createdAt.desc"
        total={100}
        onPageChange={onPageChange}
        onPageSizeChange={() => undefined}
        onSortChange={onSortChange}
      />
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "createdAt.asc");

    expect(onSortChange).toHaveBeenCalledWith("createdAt.asc");
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("T-12: page size change delegates the reset to onPageSizeChange", async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    const onPageChange = vi.fn();

    renderWithProviders(
      <TodoListControls
        page={2}
        pageSize={5}
        sort="createdAt.desc"
        total={50}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={() => undefined}
      />
    );

    const pageSizeSelect = screen.getByRole("combobox", { name: "Page size" });
    await user.selectOptions(pageSizeSelect, "10");

    expect(onPageSizeChange).toHaveBeenCalledWith(10);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("T-13: Previous button disabled on first page", () => {
    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const previousButton = screen.getByRole("button", { name: "Previous page" });
    expect(previousButton).toBeDisabled();
  });

  it("T-13: Previous button enabled on page 2+", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    renderWithProviders(
      <TodoListControls
        page={2}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        onPageChange={onPageChange}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const previousButton = screen.getByRole("button", { name: "Previous page" });
    expect(previousButton).not.toBeDisabled();

    await user.click(previousButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("T-13: Next button disabled on last page", () => {
    renderWithProviders(
      <TodoListControls
        page={2}
        pageSize={10}
        sort="createdAt.desc"
        total={20}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const nextButton = screen.getByRole("button", { name: "Next page" });
    expect(nextButton).toBeDisabled();
  });

  it("T-13: Next button enabled when more pages exist", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        onPageChange={onPageChange}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const nextButton = screen.getByRole("button", { name: "Next page" });
    expect(nextButton).not.toBeDisabled();

    await user.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("T-13: all controls disabled while fetching", () => {
    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        isFetching
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const previousButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });
    const sortSelect = screen.getByRole("combobox", { name: "Sort" });
    const pageSizeSelect = screen.getByRole("combobox", { name: "Page size" });

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(sortSelect).toBeDisabled();
    expect(pageSizeSelect).toBeDisabled();
  });

  it("a11y: sort select has label", () => {
    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    expect(screen.getByRole("combobox", { name: "Sort" })).toBeInTheDocument();
  });

  it("a11y: page size select has label", () => {
    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    expect(screen.getByRole("combobox", { name: "Page size" })).toBeInTheDocument();
  });

  it("a11y: navigation buttons have aria-label", () => {
    renderWithProviders(
      <TodoListControls
        page={2}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: "Previous page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
  });

  it("a11y: status region announces current page and total", () => {
    renderWithProviders(
      <TodoListControls
        page={2}
        pageSize={10}
        sort="createdAt.desc"
        total={35}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Showing items 11–20 of 35");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
  });

  it("a11y: status region shows no items message when empty", () => {
    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={0}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("No items");
  });

  it("renders sort options with correct labels", () => {
    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const sortSelect = screen.getByRole("combobox", { name: "Sort" });
    expect(sortSelect).toHaveTextContent("Newest first");

    const options = sortSelect.querySelectorAll("option");
    expect(options).toHaveLength(TODO_SORTS.length);
    expect(options[0]).toHaveValue("createdAt.desc");
    expect(options[0]).toHaveTextContent("Newest first");
    expect(options[1]).toHaveValue("createdAt.asc");
    expect(options[1]).toHaveTextContent("Oldest first");
  });

  it("renders page size options with correct values", () => {
    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={5}
        sort="createdAt.desc"
        total={50}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const pageSizeSelect = screen.getByRole("combobox", { name: "Page size" });
    const options = pageSizeSelect.querySelectorAll("option");
    expect(options).toHaveLength(PAGE_SIZES.length);
    PAGE_SIZES.forEach((size, index) => {
      expect(options[index]).toHaveValue(String(size));
      expect(options[index]).toHaveTextContent(String(size));
    });
  });

  it("renders filter slot when provided", () => {
    renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        filterSlot={<div data-testid="filter-slot">Filter content</div>}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    expect(screen.getByTestId("filter-slot")).toBeInTheDocument();
    expect(screen.getByText("Filter content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = renderWithProviders(
      <TodoListControls
        page={1}
        pageSize={10}
        sort="createdAt.desc"
        total={50}
        className="custom-class"
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onSortChange={() => undefined}
      />
    );

    const root = container.querySelector(".custom-class");
    expect(root).toBeInTheDocument();
  });
});
