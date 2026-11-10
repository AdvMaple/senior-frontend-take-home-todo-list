import { render, screen } from "@testing-library/react";
import { Button } from "@app/shared";

describe("shadcn integration smoke test", () => {
  it("renders a shared Button inside the web app", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
