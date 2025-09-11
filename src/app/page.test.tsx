import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders SEO H1 and key sections", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /virtual staging that sells homes faster — mls-compliant & affordable\./i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: /features/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /how it works/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /pricing preview/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /faq/i })).toBeInTheDocument();

    expect(
      screen.getByRole("form", { name: /waitlist signup form/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join the waitlist/i })
    ).toBeInTheDocument();
  });
});
