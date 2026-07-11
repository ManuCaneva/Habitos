import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import EntityContextMenu from "./EntityContextMenu.vue";

describe("EntityContextMenu", () => {
  const triggerAttr = "data-entity-menu-trigger";
  const entityId = "entity-1";

  function createTrigger() {
    const trigger = document.createElement("div");
    trigger.setAttribute(triggerAttr, entityId);
    document.body.appendChild(trigger);
    return trigger;
  }

  function mountMenu(props: Record<string, any> = {}) {
    return mount(EntityContextMenu, {
      props: {
        entityId,
        isArchived: false,
        triggerDataAttr: triggerAttr,
        ...props,
      },
      attachTo: document.body,
    });
  }

  let wrapper: any;
  let trigger: HTMLElement;

  beforeEach(() => {
    setActivePinia(createPinia());
    trigger = createTrigger();
  });

  afterEach(() => {
    wrapper?.unmount();
    trigger?.remove();
  });

  it("renders menu with role='menu'", () => {
    wrapper = mountMenu();
    const menu = document.body.querySelector("[role='menu']");
    expect(menu).not.toBeNull();
  });

  it("has Editar option", () => {
    wrapper = mountMenu();
    const menu = document.body.querySelector("[role='menu']");
    expect(menu?.textContent).toContain("Editar");
  });

  it("shows Archivar when not archived", () => {
    wrapper = mountMenu({ isArchived: false });
    const menu = document.body.querySelector("[role='menu']");
    expect(menu?.textContent).toContain("Archivar");
  });

  it("shows Restaurar when archived", () => {
    wrapper = mountMenu({ isArchived: true });
    const menu = document.body.querySelector("[role='menu']");
    expect(menu?.textContent).toContain("Restaurar");
  });

  it("emits 'edit' when Editar clicked", async () => {
    wrapper = mountMenu();
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const editBtn = buttons.find((btn) => btn.textContent?.includes("Editar"));
    editBtn?.click();
    await flushPromises();
    expect(wrapper.emitted("edit")).toHaveLength(1);
  });

  it("emits 'archive-toggle' when Archivar clicked", async () => {
    wrapper = mountMenu({ isArchived: false });
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const archiveBtn = buttons.find((btn) =>
      btn.textContent?.includes("Archivar"),
    );
    archiveBtn?.click();
    await flushPromises();
    expect(wrapper.emitted("archive-toggle")).toHaveLength(1);
  });

  it("emits 'close' on click outside", async () => {
    wrapper = mountMenu();
    await document.body.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true }),
    );
    await flushPromises();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
