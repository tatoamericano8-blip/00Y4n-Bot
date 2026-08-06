import { EmbedBuilder } from 'discord.js';
import { getFromDb, setInDb } from './database.js';
import { logger } from './logger.js';

// ⚙️ CONFIGURACIÓN
const ID_ROL_CIUDADANO_DIA = '1530287573547880581'; // Reemplaza con el ID del rol @Ciudadano del Día
const ID_CANAL_ANUNCIOS = '1451939726230683753';  // Reemplaza con el ID del canal donde se anuncia

export async function procesarCiudadanoDelDia(client) {
    try {
        // Calcular fecha de ayer para buscar al ganador del día recién concluido
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const fechaAyerStr = ayer.toISOString().split('T')[0];

        const claveListaUsuarios = `usuarios_activos:${fechaAyerStr}`;
        const listaUsuarios = await getFromDb(claveListaUsuarios, []);

        if (!listaUsuarios || listaUsuarios.length === 0) {
            logger.info('[Ciudadano del Día]: No hubo actividad registrada el día de ayer.');
            return;
        }

        let idGanador = null;
        let maxPuntos = 0;

        // Buscar al usuario con más mensajes del día anterior
        for (const userId of listaUsuarios) {
            const clavePuntos = `puntos_dia:${fechaAyerStr}:${userId}`;
            const puntos = await getFromDb(clavePuntos, 0);

            if (puntos > maxPuntos) {
                maxPuntos = puntos;
                idGanador = userId;
            }
        }

        if (!idGanador) return;

        // Obtener el canal y el servidor de Discord
        const canalAnuncios = await client.channels.fetch(ID_CANAL_ANUNCIOS).catch(() => null);
        if (!canalAnuncios) return;

        const guild = canalAnuncios.guild;
        const rol = await guild.roles.fetch(ID_ROL_CIUDADANO_DIA).catch(() => null);

        // Remover el rol al ganador anterior
        const ultimoGanadorId = await getFromDb('ultimo_ciudadano_del_dia', null);
        if (ultimoGanadorId && rol) {
            const miembroAnterior = await guild.members.fetch(ultimoGanadorId).catch(() => null);
            if (miembroAnterior) await miembroAnterior.roles.remove(rol).catch(() => {});
        }

        // Asignar el rol al nuevo ganador
        if (rol) {
            const nuevoGanadorMember = await guild.members.fetch(idGanador).catch(() => null);
            if (nuevoGanadorMember) await nuevoGanadorMember.roles.add(rol).catch(() => {});
        }

        // Guardar nuevo ganador
        await setInDb('ultimo_ciudadano_del_dia', idGanador);

        // 🎨 EMBED TRADUCIDO Y ESTILIZADO (Igual a la imagen)
        const embedCiudadano = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<:trofeo:1534938966950809751> Ciudadano del Día')
            .setDescription(
                `<:fle:1534937306191102125> Cada día, **${guild.name}** muestra su agradecimiento al ciudadano más activo en los canales de texto y voz.\n\n` +
                `¡Este usuario recibe el rol de <@&${ID_ROL_CIUDADANO_DIA}>, otorgándole **exención de vehículos restringidos**, **acceso anticipado** y **permiso para enviar imágenes** durante todo el día!\n\n` +
                `Hoy nos gustaría extender nuestro mayor agradecimiento a <@${idGanador}> por su gran participación e interacción.\n\n` +
                `*Si querés ganar, ¡simplemente sé activo en el servidor y podrías ser el próximo ganador!*`
            )
            .setFooter({ 
                text: `${guild.name} • Sistema de Recompensas`, 
                iconURL: guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();

        await canalAnuncios.send({ embeds: [embedCiudadano] });
        logger.info(`[Ciudadano del Día]: Ganador del día procesado correctamente (${idGanador} con ${maxPuntos} msgs).`);

    } catch (error) {
        logger.error('Error al procesar Ciudadano del Día:', error);
    }
}

// Inicia el temporizador diario (se ejecuta 1 vez cada 24 horas)
export function iniciarSistemaCiudadanoDelDia(client) {
    const TIEMPO_24_HORAS = 24 * 60 * 60 * 1000;
    
    // Programar primera ejecución al inicio del bot (o ajustado a la hora deseada)
    setInterval(() => {
        procesarCiudadanoDelDia(client);
    }, TIEMPO_24_HORAS);
}
