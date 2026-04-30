export const sidebarClasses = {
  itemsList: "w-0 min-w-full space-y-0.5 pb-2",
} as const;

export const sidebarItemRowClasses = {
  root: "group flex w-full min-w-0 items-center rounded-lg transition-colors duration-100",
  editInput:
    "min-w-0 flex-1 px-3 py-1.5 text-[13px] bg-background outline-none border border-border rounded-lg focus:border-foreground/30",
  selectButton:
    "flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-left text-[13px]",
  icon: "shrink-0",
  name: "min-w-0 flex-1 truncate",
  actions: "mr-1 flex shrink-0 items-center justify-end gap-1",
  trailing: "flex shrink-0 items-center pointer-events-none",
  menuButton:
    "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring group-hover:opacity-100",
} as const;
