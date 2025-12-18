import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
	plugins: [react(), tailwindcss(), nitro({ preset: "bun" })],
});
