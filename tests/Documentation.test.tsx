import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Documentation from "../components/system/Documentation";

describe("Documentation", () => {
    it("renders quick links with valid targets", () => {
        render(<Documentation />);

        expect(
            screen.getByRole("link", { name: /user guide/i }),
        ).toHaveAttribute(
            "href",
            "https://volcano.sh/docs/UserGuide/user_guide",
        );
        expect(
            screen.getByRole("link", { name: /core concepts/i }),
        ).toHaveAttribute("href", "https://volcano.sh/docs/Concepts/Queue");
        expect(
            screen.getByRole("link", { name: /api documentation/i }),
        ).toHaveAttribute("href", "https://pkg.go.dev/volcano.sh/apis");
        expect(screen.getAllByRole("link")).toHaveLength(3);
        expect(screen.getByText("Official References")).toBeInTheDocument();
    });
});
