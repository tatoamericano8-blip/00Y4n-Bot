import { Events } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getFromDb, setInDb, db } from '../utils/database.js';
import Sesion from '../../models/Session.js';

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

      // -------------------------------------------------------------
      // 🚗 TRACKING DE REACCIONES EN SESIONES (para /tabla_posiciones)
      // Cuenta cada reacción hecha sobre un mensaje de /inicio_swfl,
      // para saber quién reacciona más para unirse a las sesiones.
      // -------------------------------------------------------------
      try {
        const sesion = await Sesion.findOne({
          idInicio: reaction.message.id,
          guildId: reaction.message.guild.id
        }).lean();

        if (sesion) {
          const claveReaccionesSesion = `reacciones_sesiones:${reaction.message.guild.id}:${user.id}`;
          await db.increment(claveReaccionesSesion, 1);
        }
      } catch (error) {
        logger.error('Error al trackear reacción en mensaje de sesión:', error);
      }

    } catch (error) {
      logger.error('Error en el evento messageReactionAdd:', error);
    }
  }
};
