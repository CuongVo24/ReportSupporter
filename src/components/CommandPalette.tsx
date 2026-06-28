"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, Input } from "@/components/ui";
import {
  commandGroupLabels,
  filterCommands,
  groupCommands,
  type Command,
  type CommandGroup,
} from "./command-registry";

type CommandPaletteProps = {
  isOpen: boolean;
  commands: Command[];
  onOpenChange: (open: boolean) => void;
};

const commandGroups: CommandGroup[] = ["write", "review", "view", "export", "setup"];

export function CommandPalette({ isOpen, commands, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const filteredCommands = useMemo(() => filterCommands(commands, query), [commands, query]);
  const groupedCommands = useMemo(() => groupCommands(filteredCommands), [filteredCommands]);
  const activeCommand = filteredCommands[activeIndex] ?? filteredCommands[0];

  useEffect(() => {
    if (!isOpen) return;

    setQuery("");
    setActiveIndex(0);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(filteredCommands.length - 1, 0)));
  }, [filteredCommands.length]);

  const executeCommand = (command: Command) => {
    onOpenChange(false);
    command.run();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (filteredCommands.length ? (index + 1) % filteredCommands.length : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        filteredCommands.length ? (index - 1 + filteredCommands.length) % filteredCommands.length : 0,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeCommand) executeCommand(activeCommand);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Bang lenh"
      description="Tim nhanh hanh dong trong khong gian viet bao cao."
      variant="modal"
    >
      <div className="ws-command-palette">
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tim lenh..."
          aria-label="Tim lenh"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeCommand ? `${listboxId}-${activeCommand.id}` : undefined}
          leadingIcon={<Search size={16} />}
        />

        <div
          id={listboxId}
          className="ws-command-list"
          role="listbox"
          aria-label="Lenh kha dung"
        >
          {filteredCommands.length === 0 ? (
            <div className="ws-command-empty" role="status">
              Khong co lenh phu hop.
            </div>
          ) : (
            commandGroups.map((group) => {
              const groupCommandsForView = groupedCommands[group];
              if (groupCommandsForView.length === 0) return null;

              return (
                <div key={group} className="ws-command-group">
                  <div className="ws-command-group-label">{commandGroupLabels[group]}</div>
                  {groupCommandsForView.map((command) => {
                    const index = filteredCommands.findIndex((item) => item.id === command.id);
                    const isActive = command.id === activeCommand?.id;

                    return (
                      <button
                        key={command.id}
                        id={`${listboxId}-${command.id}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`ws-command-item ${isActive ? "ws-command-item-active" : ""}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => executeCommand(command)}
                      >
                        <span className="ws-command-label">{command.label}</span>
                        {command.hint && <kbd className="ws-command-hint">{command.hint}</kbd>}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Dialog>
  );
}
