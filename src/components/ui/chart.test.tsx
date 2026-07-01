import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Bar, BarChart, Line, LineChart, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./chart";

// Regression suite for the shadcn+recharts wrapper. These tests exist to
// catch typing/runtime breakages when recharts publishes major upgrades
// (e.g. the v3 label prop typing regression).

const config = {
  revenue: { label: "Revenue", color: "hsl(210 90% 50%)" },
  cost: { label: "Cost", color: "hsl(10 90% 50%)" },
} satisfies ChartConfig;

const data = [
  { month: "Jan", revenue: 120, cost: 80 },
  { month: "Feb", revenue: 180, cost: 90 },
  { month: "Mar", revenue: 150, cost: 100 },
];

describe("ChartContainer", () => {
  it("renders children with a stable data-chart id and injects color CSS vars", () => {
    const { container } = render(
      <ChartContainer id="demo" config={config}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <Bar dataKey="revenue" fill="var(--color-revenue)" />
          <Bar dataKey="cost" fill="var(--color-cost)" />
        </BarChart>
      </ChartContainer>,
    );

    const wrapper = container.querySelector("[data-chart='chart-demo']");
    expect(wrapper).not.toBeNull();

    const style = container.querySelector("style");
    expect(style?.innerHTML).toContain("--color-revenue: hsl(210 90% 50%)");
    expect(style?.innerHTML).toContain("--color-cost: hsl(10 90% 50%)");
  });

  it("accepts a LineChart child without type errors", () => {
    const { container } = render(
      <ChartContainer config={config}>
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <Line dataKey="revenue" stroke="var(--color-revenue)" />
        </LineChart>
      </ChartContainer>,
    );
    expect(container.querySelector("[data-chart]")).not.toBeNull();
  });
});

describe("ChartTooltipContent", () => {
  it("returns null when inactive (no runtime errors)", () => {
    const { container } = render(
      <ChartContainer config={config}>
        <BarChart data={data}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="revenue" />
        </BarChart>
      </ChartContainer>,
    );
    // Tooltip not triggered → nothing to render.
    expect(container.querySelector(".recharts-tooltip")).toBeNull();
  });

  it("renders payload rows when active", () => {
    const props: Record<string, unknown> = {
      active: true,
      label: "Feb",
      payload: [
        {
          name: "revenue",
          value: 180,
          dataKey: "revenue",
          color: "hsl(210 90% 50%)",
          payload: { month: "Feb", revenue: 180 },
        },
      ],
    };
    render(
      <ChartContainer config={config}>
        <BarChart data={data}>
          <ChartTooltipContent {...props} />
          <Bar dataKey="revenue" />
        </BarChart>
      </ChartContainer>,
    );
    expect(screen.getByText("180")).toBeInTheDocument();
  });
});

describe("ChartLegendContent", () => {
  it("renders labels for each payload entry", () => {
    render(
      <ChartContainer config={config}>
        <BarChart data={data}>
          <ChartLegend
            content={
              <ChartLegendContent
                payload={[
                  { value: "revenue", dataKey: "revenue", color: "hsl(210 90% 50%)" } as never,
                  { value: "cost", dataKey: "cost", color: "hsl(10 90% 50%)" } as never,
                ]}
              />
            }
          />
          <Bar dataKey="revenue" />
          <Bar dataKey="cost" />
        </BarChart>
      </ChartContainer>,
    );
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Cost")).toBeInTheDocument();
  });

  it("returns null with an empty payload", () => {
    const { container } = render(<ChartLegendContent payload={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
