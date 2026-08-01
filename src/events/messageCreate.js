import { Events } from 'discord.js';
import { cachearMensaje } from '../utils/gestorSnipe.js';

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message) {
    try {
      // Cache para /snipe (por si al borrar Discord manda el mensaje partial)
      if (message.guild && !message.author?.bot) {
        cachearMensaje(message);
      }
    } catch {
      // no crítico
    }
  }
};
