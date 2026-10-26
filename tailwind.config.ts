import type { Config } from "tailwindcss";
import {heroui} from "@heroui/react";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)"],
        poppins: ["var(--font-poppins)"],
      },
      colors: {
        // You can define your custom colors here
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    heroui(
      {
        "themes": {
          "light": {
            "colors": {
              "primary": {
                "50": "#eff1fb",
                "100": "#d8ddf6",
                "200": "#c1c9f0",
                "300": "#abb6eb",
                "400": "#94a2e5",
                "500": "#7d8ee0",
                "600": "#6775b9",
                "700": "#515c92",
                "800": "#3b436a",
                "900": "#262b43",
                "foreground": "#000",
                "DEFAULT": "#7d8ee0"
              },
              "secondary": {
                "50": "#ebe5f1",
                "100": "#cec0dd",
                "200": "#b29cc8",
                "300": "#9677b4",
                "400": "#7953a0",
                "500": "#5d2e8c",
                "600": "#4d2674",
                "700": "#3c1e5b",
                "800": "#2c1643",
                "900": "#1c0e2a",
                "foreground": "#fff",
                "DEFAULT": "#5d2e8c"
              },
              "success": {
                "50": "#e7f5ee",
                "100": "#c4e8d5",
                "200": "#a2dabd",
                "300": "#80cda4",
                "400": "#5dbf8c",
                "500": "#3bb273",
                "600": "#31935f",
                "700": "#26744b",
                "800": "#1c5537",
                "900": "#123523",
                "foreground": "#000",
                "DEFAULT": "#3bb273"
              },
              "warning": {
                "50": "#fdf1df",
                "100": "#fbddb3",
                "200": "#f8ca86",
                "300": "#f6b65a",
                "400": "#f3a32d",
                "500": "#f18f01",
                "600": "#c77601",
                "700": "#9d5d01",
                "800": "#724400",
                "900": "#482b00",
                "foreground": "#000",
                "DEFAULT": "#f18f01"
              },
              "danger": {
                "50": "#fbeaeb",
                "100": "#f4ccd0",
                "200": "#eeaeb4",
                "300": "#e89098",
                "400": "#e1727d",
                "500": "#db5461",
                "600": "#b54550",
                "700": "#8e373f",
                "800": "#68282e",
                "900": "#42191d",
                "foreground": "#000",
                "DEFAULT": "#db5461"
              },
              "background": "#fbfcfe",
              "foreground": "#040407",
              "content1": {
                "DEFAULT": "#fcfdff",
                "foreground": "#000"
              },
              "content2": {
                "DEFAULT": "#f7f8ff",
                "foreground": "#000"
              },
              "content3": {
                "DEFAULT": "#e6e8f8",
                "foreground": "#000"
              },
              "content4": {
                "DEFAULT": "#cbd2f3",
                "foreground": "#000"
              },
              "focus": "#7d8ee0",
              "overlay": "#040407"
            }
          },
          "dark": {
            "colors": {
              "primary": {
                "50": "#eff1fb",
                "100": "#d8ddf6",
                "200": "#c1c9f0",
                "300": "#abb6eb",
                "400": "#94a2e5",
                "500": "#7d8ee0",
                "600": "#6775b9",
                "700": "#515c92",
                "800": "#3b436a",
                "900": "#262b43",
                "foreground": "#000",
                "DEFAULT": "#7d8ee0"
              },
              "secondary": {
                "50": "#ebe5f1",
                "100": "#cec0dd",
                "200": "#b29cc8",
                "300": "#9677b4",
                "400": "#7953a0",
                "500": "#5d2e8c",
                "600": "#4d2674",
                "700": "#3c1e5b",
                "800": "#2c1643",
                "900": "#1c0e2a",
                "foreground": "#fff",
                "DEFAULT": "#5d2e8c"
              },
              "background": "#040407",
              "foreground": "#fbfcfe",
              "content1": {
                "DEFAULT": "#11131f",
                "foreground": "#fff"
              },
              "content2": {
                "DEFAULT": "#262b44",
                "foreground": "#fff"
              },
              "content3": {
                "DEFAULT": "#32395a",
                "foreground": "#fff"
              },
              "content4": {
                "DEFAULT": "#4b5586",
                "foreground": "#fff"
              },
              "focus": "#7d8ee0",
              "overlay": "#ffffff"
            }
          }
        },
        "layout": {
          "disabledOpacity": "0.5"
        }
      }
    ),
  ],
} satisfies Config;

export default config;
