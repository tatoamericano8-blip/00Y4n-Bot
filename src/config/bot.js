import { logger } from '../utils/logger.js';
import { PRIMARIO } from '../utils/colores.js';


export const botConfig = {
  presence: {
    status: "online",
    activities: [
      {
        name: "Viva /00Y4n",
        type: 0,
      },
    ],
  },

  commands: {
    owners: process.env.OWNER_IDS?.split(",") || [],
    defaultCooldown: 3,
    deleteCommands: false,
    testGuildId: process.env.TEST_GUILD_ID,
  },

  applications: {
    defaultQuestions: [
      { question: "What is your name?", required: true },
      { question: "How old are you?", required: true },
      { question: "Why do you want to join?", required: true },
    ],
    statusColors: {
      pending: "#FFA500",
      approved: "#00FF00",
      denied: "#FF0000",
    },
    applicationCooldown: 24,
    deleteDeniedAfter: 7,
    deleteApprovedAfter: 30,
  },

  embeds: {
    colors: {
      primary: PRIMARIO,
      secondary: PRIMARIO,
      success: PRIMARIO,
      error: "#ED4245",
      warning: PRIMARIO,
      info: PRIMARIO,
      light: "#FFFFFF",
      dark: "#202225",
      gray: "#99AAB5",
      blurple: "#5865F2",
      green: "#57F287",
      yellow: "#FEE75C",
      fuchsia: "#EB459E",
      red: "#ED4245",
      black: "#000000",
      giveaway: {
        active: PRIMARIO,
        ended: PRIMARIO,
      },
      ticket: {
        open: PRIMARIO,
        claimed: PRIMARIO,
        closed: PRIMARIO,
        pending: PRIMARIO,
      },
      economy: PRIMARIO,
      birthday: PRIMARIO,
      moderation: PRIMARIO,
      priority: {
        none: "#95A5A6",
        low: "#3498db",
        medium: "#2ecc71",
        high: "#f1c40f",
        urgent: "#e74c3c",
      },
    },
    footer: {
      text: "00Y4n Comunidad SWFL",
    },
  },
};

export const BotConfig = botConfig;

export function getColor(path, fallback = "#99AAB5") {
  if (typeof path === "number") return path;
  if (typeof path === "string" && path.startsWith("#")) {
    return parseInt(path.replace("#", ""), 16);
  }
  const result = path
    .split(".")
    .reduce(
      (obj, key) => (obj && obj[key] !== undefined ? obj[key] : fallback),
      botConfig.embeds.colors,
    );
  if (typeof result === "string" && result.startsWith("#")) {
    return parseInt(result.replace("#", ""), 16);
  }
  return result;
}

export function getRandomColor() {
  const colors = Object.values(botConfig.embeds.colors).flatMap((color) =>
    typeof color === "string" ? color : Object.values(color),
  ).filter(c => typeof c === 'string' && c.startsWith('#'));
  return colors[Math.floor(Math.random() * colors.length)] || PRIMARIO;
}

export default botConfig;
