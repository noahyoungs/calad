"use client";

import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from '@iconify-icon/react';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 20;

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="light" color="warning" isIconOnly className="!text-[#ffd125]">
          {theme === "light" ? (
            <Icon
              key="light"
              icon="tabler:sun"
              width={ICON_SIZE}
              height={ICON_SIZE}
              className="text-yellow-500"
            />
          ) : theme === "dark" ? (
            <Icon
              key="dark"
              icon="tabler:moon"
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ) : (
            <Icon
              key="system"
              icon="tabler:device-laptop"
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu 
        aria-label="Theme options" 
        selectedKeys={theme ? [theme] : []}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0]?.toString();
          if (selectedKey) {
            setTheme(selectedKey);
          }
        }}
      >
        <DropdownItem key="light" startContent={<Icon icon="tabler:sun" width={ICON_SIZE} height={ICON_SIZE} />}>
          Light
        </DropdownItem>
        <DropdownItem key="dark" startContent={<Icon icon="tabler:moon" width={ICON_SIZE} height={ICON_SIZE} />}>
          Dark
        </DropdownItem>
        <DropdownItem key="system" startContent={<Icon icon="tabler:device-laptop" width={ICON_SIZE} height={ICON_SIZE} />}>
          System
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export { ThemeSwitcher };
