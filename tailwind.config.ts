import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta extraída da logo Usepy (marrom/dourado sobre branco)
        usepy: {
          bark: "#3A2415",   // marrom escuro para texto/headers
          copper: "#A86C2A", // marrom-dourado principal (cor da logo)
          gold: "#C9922F",   // dourado mais claro, para acentos/hover
          sand: "#F4EDE2",   // bege claro para seções alternadas
          cream: "#FBF9F5",  // fundo base, quase branco
          ink: "#211509",    // texto principal, quase preto
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
