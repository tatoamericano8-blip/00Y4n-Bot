import { Events } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getFromDb, setInDb, db } from '../utils/database.js';
import Sesion from '../../models/Session.js';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    try {
      // Ignorar bots o DMs
      if (user.bot || !reaction.message.guild) return;

      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          logger.error('Error al obtener la reacción parcial:', error);
          return;
        }
      }

      // Ciudadano del día (actividad por reacción)
      const hoyStr = new Date().toISOString().split('T')[0];
      const clavePuntos = `puntos_dia:${hoyStr}:${user.id}`;
      const claveListaUsuarios = `usuarios_activos:${hoyStr}`;

      const puntosActuales = await getFromDb(clavePuntos, 0);
      await setInDb(clavePuntos, puntosActuales + 1);

      const listaUsuarios = await getFromDb(claveListaUsuarios, []);
      if (!listaUsuarios.includes(user.id)) {
        listaUsuarios.push(user.id);
        await setInDb(claveListaUsuarios, listaUsuarios);
      }

      // Reacciones en sesiones: 1 vez por usuario POR mensaje de /inicio_swfl
      // Si quita y vuelve a reaccionar en el MISMO mensaje, no suma de nuevo.
      try {
        const guildId = reaction.message.guild.id;
        const messageId = reaction.message.id;
        const sesion = await Sesion.findOne({
          idInicio: messageId,
          guildId
        }).lean();

        if (sesion) {
          const dedupeKey = `reaccion_sesion_contada:${guildId}:${messageId}:${user.id}`;
          const yaContada = await getFromDb(dedupeKey, false);
          if (!yaContada) {
            await setInDb(dedupeKey, true);
            const claveReaccionesSesion = `reacciones_sesiones:${guildId}:${user.id}`;
            await db.increment(claveReaccionesSesion, 1);
          }
        }
      } catch (error) {
        logger.error('Error al trackear reacción en mensaje de sesión:', error);
      }

    } catch (error) {
      logger.error('Error en el evento messageReactionAdd:', error);
    }
  }
};
