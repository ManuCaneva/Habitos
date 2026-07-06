import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Container from "./Container.vue";

describe("Container", () => {
  it("renderiza un div por default con clases base (default variant, md padding)", () => {
    const wrapper = mount(Container, {
      slots: { default: "contenido" },
    });
    expect(wrapper.element.tagName).toBe("DIV");
    expect(wrapper.classes()).toContain("bg-surface-1");
    expect(wrapper.classes()).toContain("border");
    expect(wrapper.classes()).toContain("border-hairline");
    expect(wrapper.classes()).toContain("rounded-sm");
    expect(wrapper.classes()).toContain("p-3");
  });

  it("variant=ghost: fondo transparente, sin border", () => {
    const wrapper = mount(Container, {
      props: { variant: "ghost" },
      slots: { default: "x" },
    });
    expect(wrapper.classes()).toContain("bg-transparent");
    expect(wrapper.classes()).toContain("border-transparent");
  });

  it("variant=dashed: border dashed", () => {
    const wrapper = mount(Container, {
      props: { variant: "dashed" },
      slots: { default: "x" },
    });
    expect(wrapper.classes()).toContain("border-dashed");
  });

  it("padding=sm aplica p-2", () => {
    const wrapper = mount(Container, {
      props: { padding: "sm" },
      slots: { default: "x" },
    });
    expect(wrapper.classes()).toContain("p-2");
    expect(wrapper.classes()).not.toContain("p-3");
  });

  it("padding=none: sin padding", () => {
    const wrapper = mount(Container, {
      props: { padding: "none" },
      slots: { default: "x" },
    });
    expect(wrapper.classes()).not.toContain("p-2");
    expect(wrapper.classes()).not.toContain("p-3");
    expect(wrapper.classes()).not.toContain("p-4");
  });

  it("renderiza el slot", () => {
    const wrapper = mount(Container, {
      slots: { default: "<span>hola</span>" },
    });
    expect(wrapper.text()).toBe("hola");
  });

  it("as=button renderiza un button", () => {
    const wrapper = mount(Container, {
      props: { as: "button" },
      slots: { default: "click" },
    });
    expect(wrapper.element.tagName).toBe("BUTTON");
  });

  it("tiene select-none por default (no permite seleccionar texto)", () => {
    const wrapper = mount(Container, {
      slots: { default: "x" },
    });
    expect(wrapper.classes()).toContain("select-none");
  });

  it("tiene min-h-0 por default (para funcionar bien en flex containers)", () => {
    const wrapper = mount(Container, {
      slots: { default: "x" },
    });
    expect(wrapper.classes()).toContain("min-h-0");
  });
});
