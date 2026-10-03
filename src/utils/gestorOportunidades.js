import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { agregarSaldo } from './gestorEconomia.js';
import { PRIMARIO } from './colores.js';
import { logger } from './logger.js';
import { getFromDb, setInDb } from './database.js';
import { E, EMOJI_DEF } from '../config/emojis.js';

/** Banner de oportunidad (solo imagen) — se envía como primer embed */
const BANNER_OPORTUNIDAD_URL =
    'https://cdn.discordapp.com/attachments/1505017301089652898/1548119381920194651/Oportunidad_economica_1.png?ex=6aa5e607&is=6aa49487&hm=42ac7700491d785d4da339f910bc6c66b7e28b6fb56040ee8591c73781123677&';

const historiasOportunidades = [
    "de un lavaplatos del Diner local que te pagó por decirle a los clientes que la sopa era 'especial del chef' y no las sobras de ayer.",
    "de un conductor en Siesta Key que te pagó por cuidarle el lugar de estacionamiento durante 10 minutos.",
    "por ayudar a empujar un vehículo averiado fuera del carril rápido en la Interestatal de Sarasota.",
    "de un fotógrafo de autos de lujo que te dio una propina por mover tu auto para que no arruinara su toma.",
    "por encontrar las llaves perdidas de un Ferrari cerca del centro comercial de Sarasota.",
    "de un mecánico local que te pagó por ir a buscar un repuesto urgente a la tienda de repuestos.",
    "por ayudar a limpiar un choque menor en la avenida principal antes de que llegara la policía de Sarasota.",
    "de un turista en Lido Beach que te pagó por indicarle cómo llegar al muelle sin usar el GPS.",
    "por devolver una billetera olvidada en un banco del parque de Venice.",
    "de un dueño de food truck que te dio una propina por ayudarlo a armar la carpa antes de la lluvia.",
    "por cuidar el puesto de limonada de unos chicos mientras iban a comprar hielo.",
    "de un conductor de Uber que te pagó por ayudarlo a encontrar su celular debajo del asiento.",
    "por cargar cajas de agua embotellada en un evento comunitario de Sarasota.",
    "de un pescador en el muelle que te pagó por ayudarlo a subir una nevera pesada a su camioneta.",
    "por orientar a una familia perdida cerca del aeropuerto de Sarasota-Bradenton.",
    "de un DJ local que te dio una propina por ayudarlo a conectar el equipo de sonido a tiempo.",
    "por recoger basura en la playa durante una jornada de limpieza improvisada.",
    "de un vendedor de autos usados que te pagó por lavar tres vehículos antes de una entrega.",
    "por ayudar a un vecino a cambiar un neumático pinchado en el estacionamiento del supermercado.",
    "de un influencer de autos que te dio una propina por filmar unos segundos de su reel sin que se notara.",
    "por devolver un perro extraviado a su dueño cerca de St. Armands Circle.",
    "de un conductor de mudanzas que te pagó por ayudarlo a bajar un sofá por la escalera.",
    "por traducir un menú a un turista en un restaurante de Siesta Key.",
    "de un organizador de car meet que te dio una propina por acomodar conos al final del evento.",
    "por encontrar un celular en el baño de una gasolinera y devolvérselo al dueño.",
    "de un jardinero que te pagó por ayudarlo a cargar bolsas de tierra en su pickup.",
    "por sostener la puerta de un local mientras entraban con una entrega grande.",
    "de un fotógrafo de bodas en la playa que te dio una propina por no cruzarte en la toma.",
    "por ayudar a empujar un carrito de supermercado atascado en el estacionamiento.",
    "de un dueño de café que te pagó por cubrir 20 minutos de caja mientras atendía una emergencia.",
    "por acompañar a una persona mayor a cruzar la avenida con semáforo en rojo intermitente.",
    "de un streamer de Roblox que te dio una propina por prestarle tu cargador en un café.",
    "por ayudar a recoger sillas después de un evento en el parque de Sarasota.",
    "de un taxista que te pagó por indicarle un atajo para evitar el tráfico del puente.",
    "por devolver unas gafas de sol caras olvidadas en una banca del malecón.",
    "de un instructor de manejo que te dio una propina por calmar a un alumno nervioso en el primer examen.",
    "por ayudar a un repartidor a encontrar el edificio correcto en un complejo confuso.",
    "de un dueño de lavadero de autos que te pagó por aspirar el interior de dos vehículos.",
    "por avisar a tiempo a un conductor que se le había abierto el baúl en plena avenida.",
    "de un organizador de torneo local que te dio una propina por anotar resultados durante una hora.",
    "por ayudar a inflar un neumático con el compresor de una estación de servicio.",
    "de un vendedor ambulante que te pagó por cuidarle el puesto mientras iba al baño.",
    "por recuperar un drone que se había enganchado en un árbol del parque.",
    "de un dueño de taller que te dio una propina por ordenar herramientas al cierre del día.",
    "por ayudar a una pareja a sacar una selfie grupal con el skyline de Sarasota de fondo."
];

function crearEmbedBanner() {
    return new EmbedBuilder().setColor(PRIMARIO).setImage(BANNER_OPORTUNIDAD_URL);
}

/**
 * Lanza una Oportunidad Económica en un canal específico.
 * @param {import('discord.js').Client} client
 * @param {string} canalId
 */
export const LAST_OPORTUNIDAD_KEY = 'oportunidad:lastLaunch';

export async function lanzarOportunidadEconomica(client, canalId) {
    try {
        const canal = await client.channels.fetch(canalId).catch((e) => {
            logger.error(`[oportunidad] No se pudo fetch canal ${canalId}:`, e.message);
            return null;
        });
        if (!canal) {
            logger.warn(`[oportunidad] Canal ${canalId} no encontrado o sin acceso.`);
            return;
        }
        if (!canal.isTextBased?.() && canal.type !== 0 && canal.type !== 5) {
            logger.warn(`[oportunidad] Canal ${canalId} no es de texto.`);
            return;
        }

        // Ganancia aleatoria: $1.000 – $10.000
        const monto = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
        const historia = historiasOportunidades[Math.floor(Math.random() * historiasOportunidades.length)];

        const embedBanner = crearEmbedBanner();

        const embedInicial = new EmbedBuilder()
            .setColor(PRIMARIO)
            .setTitle(E.a2alas + ' ¡Oportunidad Economica!')
            .setDescription(`${E.dinero} **$${monto.toLocaleString('es-AR')}** ${historia}`)
            .setTimestamp();

        const botonActivo = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('reclamar_oportunidad')
                .setLabel('Reclamar')
                .setEmoji(EMOJI_DEF.money.id)
                .setStyle(ButtonStyle.Secondary)
        );

        const mensaje = await canal.send({
            embeds: [embedBanner, embedInicial],
            components: [botonActivo]
        });
        try {
            await setInDb(LAST_OPORTUNIDAD_KEY, Date.now());
        } catch (_) {}

        // Persistente hasta que alguien reclame (sin expiración por tiempo)
        try {
            await setInDb(oportunidadKey(mensaje.id), {
                monto,
                historia,
                channelId: canal.id,
                messageId: mensaje.id,
                claimed: false,
                createdAt: Date.now()
            });
        } catch (e) {
            logger.warn('[oportunidad] No se pudo guardar estado:', e?.message || e);
        }

        logger.info(`[oportunidad] Enviada en #${canal.name || canalId} — $${monto} (sin expiración)`);
    } catch (error) {
        logger.error('Error al lanzar Oportunidad Económica:', error);
    }
}

export function oportunidadKey(messageId) {
    return `oportunidad:msg:${String(messageId)}`;
}

/**
 * Reclama una oportunidad económica por messageId (sin expiración).
 * @returns {{ ok: boolean, reason?: string, monto?: number }}
 */
export async function reclamarOportunidadPorMensaje(messageId, usuarioId) {
    const key = oportunidadKey(messageId);
    const data = await getFromDb(key, null);
    if (!data || typeof data !== 'object') {
        return { ok: false, reason: 'no_encontrada' };
    }
    if (data.claimed) {
        return { ok: false, reason: 'ya_reclamada' };
    }

    // Marcar primero para reducir race conditions
    data.claimed = true;
    data.claimedBy = String(usuarioId);
    data.claimedAt = Date.now();
    await setInDb(key, data);

    const monto = Number(data.monto) || 0;
    if (monto > 0) {
        await agregarSaldo(usuarioId, monto, {
            tipo: 'INGRESO',
            motivo: 'Oportunidad económica'
        });
    }

    return {
        ok: true,
        monto,
        historia: data.historia || ''
    };
}
