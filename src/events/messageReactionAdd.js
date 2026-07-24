import { Events } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getFromDb, setInDb } from '../utils/database.js';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    try {
      // 🔒 Ignorar reacciones de bots o si ocurren en mensajes privados (DMs)
      if (user.bot || !reaction.message.guild) return;

      // 🔄 Si la reacción ocurrió en un mensaje viejo/parcial, intentamos cargarlo
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          logger.error('Error al obtener la reacción parcial:', error);
          return;
        }
      }

      // -------------------------------------------------------------
      // 📊 CONTADOR DE ACTIVIDAD POR REACCIÓN (CIUDADANO DEL DÍA)
      // -------------------------------------------------------------
      const hoyStr = new Date().toISOString().split('T')[0];
      const clavePuntos = `puntos_dia:${hoyStr}:${user.id}`;
      const claveListaUsuarios = `usuarios_activos:${hoyStr}`;

      // 1. Sumar +1 punto al usuario por reaccionar
      const puntosActuales = await getFromDb(clavePuntos, 0);
      await setInDb(clavePuntos, puntosActuales + 1);

      // 2. Registrar al usuario en la lista de activos del día si aún no figura
      const listaUsuarios = await getFromDb(claveListaUsuarios, []);
      if (!listaUsuarios.includes(user.id)) {
        listaUsuarios.push(user.id);
        await setInDb(claveListaUsuarios, listaUsuarios);
      }

    } catch (error) {
      logger.error('Error en el evento messageReactionAdd:', error);
    }
  }
};
