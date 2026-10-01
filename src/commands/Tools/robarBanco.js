import {
    SlashCommandBuilder,
    EmbedBuilder
} from 'discord.js';
import { agregarSaldo } from '../../utils/gestorEconomia.js';
import { getFromDb, setInDb } from '../../utils/database.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

const ROL_POLICIA_ID = '1529146302783422706';
const ROL_ALTO_MANDO_ID = '1528870731629465752';
const CHANNEL_LOGS = '1529175493029531738';

const TIEMPO_UNION_MS = 80 * 1000;
const TIEMPO_ROBO_MS = 60 * 1000;
const COOLDOWN_MS = 12 * 60 * 60 * 1000;
const COOLDOWN_INTERVENIR_MS = 60 * 60 * 1000;
const MIN_PERSONAS = 2;
const MAX_PERSONAS = 3;
const RECOMPENSA_MIN = 10000;
const RECOMPENSA_MAX = 25000;
const CHANCE_EXITO = 60;
const NARRATIVA_INTERVAL_MS = 15 * 1000;

/** Frases de ambiente durante el robo (estilo heist, en español) */
const NARRATIVA_ROBO = [
    'La policía patrulla el estacionamiento. Ustedes en el techo. Alguien estornudó. Todos miraron. Los patrulleros se fueron. No saben por qué.',
    'Alguien trajo papas fritas. Están comiendo en la bóveda. El mejor o el peor robo. No hay término medio.',
    'El guardia mira el partido en el celular. Está metido. Podrían hasta dormirse. No se va a dar cuenta.',
    'Uno pisó un chicle. Pegado al piso. Al despegarse hizo un ruido enorme. El guardia se da vuelta. No ve nada. De milagro.',
    'Todos adentro. Todos afuera. Muy rápido. Se olvidaron la plata. Vuelven. No vuelven. Deciden volver.',
    'Conseguieron el dinero. Corren al auto. Pinchadura. Claro. Cómo no iba a haber una pinchadura.',
    'La puerta de la bóveda está trabada. El primo de alguien dijo que sabía abrirla. No sabe. Está intentando. Todos esperando.',
    'Encontraron la caja fuerte. Es de piso. Bajo una alfombra. Bajo un escritorio. Bajo un montón de trastos.',
    'La banda entra por atrás. El guardia en el celular viendo el partido. Ni levantó la vista. Bendecidos.',
    'El chofer del escape se durmió. En el auto. Están golpeando el vidrio. Ronca. Clásico.',
    'La caja tenía un post-it con la combinación. Debajo decía “contraseña”. Alguien fue despedido. Ustedes comiendo tranquilos.',
    'Sirenas a lo lejos. Todavía no son para ustedes. O sí. Nadie quiere mirar por la ventana.',
    'Un civil grita afuera. El equipo se congela. Era alguien peleando por estacionar. Siguen.',
    'La alarma silenciosa… ¿se activó? Nadie sabe. El que iba a cortar el cable se distrajo con un meme.',
    'Escuchan pasos en el pasillo. Contienen la respiración. Era el aire acondicionado. Siguen sacando billetes.',
    'Alguien dice “¿y si nos rendimos?”. Nadie responde. Siguen cargando bolsos.',
    'Un patrullero dobla la esquina. Baja la velocidad. Sigue de largo. El equipo no parpadea en 10 segundos.',
    'Falta poco. Las manos tiemblan. El botín pesa. La salida está a una puerta de distancia.'
];


const heistsActivos = new Map();

function generarRecompensa() {
    return Math.floor(Math.random() * (RECOMPENSA_MAX - RECOMPENSA_MIN + 1)) + RECOMPENSA_MIN;
}

function puedeIntervenir(member) {
    if (!member) return false;
    return (
        member.roles.cache.has(ROL_POLICIA_ID) ||
        member.roles.cache.has(ROL_ALTO_MANDO_ID)
    );
}

async function estaEnCooldown(usuarioId) {
    const clave = `cooldown:heist:${usuarioId}`;
    const proximo = await getFromDb(clave, 0);
    return proximo && Date.now() < proximo ? proximo : null;
}

async function aplicarCooldown(usuarioId) {
    const clave = `cooldown:heist:${usuarioId}`;
    await setInDb(clave, Date.now() + COOLDOWN_MS);
}

async function estaEnCooldownIntervenir(usuarioId) {
    const clave = `cooldown:heist-intervenir:${usuarioId}`;
    const proximo = await getFromDb(clave, 0);
    return proximo && Date.now() < proximo ? proximo : null;
}

async function aplicarCooldownIntervenir(usuarioId) {
    const clave = `cooldown:heist-intervenir:${usuarioId}`;
    await setInDb(clave, Date.now() + COOLDOWN_INTERVENIR_MS);
}

function limpiarTimers(heist) {
    if (heist?.timeoutUnion) clearTimeout(heist.timeoutUnion);
    if (heist?.timeoutRobo) clearTimeout(heist.timeoutRobo);
    if (heist?.intervaloNarrativa) clearInterval(heist.intervaloNarrativa);
    if (heist?._narrativaTimeout) clearTimeout(heist._narrativaTimeout);
    heist.timeoutUnion = null;
    heist.timeoutRobo = null;
    heist.intervaloNarrativa = null;
    heist._narrativaTimeout = null;
}

function iniciarNarrativaRobo(channel, heist) {
    if (!channel || !heist) return;
    const usadas = new Set();

    const enviarUna = async () => {
        const actual = heistsActivos.get(heist.guildId);
        if (!actual || actual.fase !== 'en_curso') {
            if (heist.intervaloNarrativa) clearInterval(heist.intervaloNarrativa);
            heist.intervaloNarrativa = null;
            return;
        }
        let disponibles = NARRATIVA_ROBO.map((_, i) => i).filter((i) => !usadas.has(i));
        if (disponibles.length === 0) {
            usadas.clear();
            disponibles = NARRATIVA_ROBO.map((_, i) => i);
        }
        const idx = disponibles[Math.floor(Math.random() * disponibles.length)];
        usadas.add(idx);
        try {
            await channel.send({ content: NARRATIVA_ROBO[idx] });
        } catch (_) {}
    };

    heist._narrativaTimeout = setTimeout(() => {
        enviarUna();
        heist.intervaloNarrativa = setInterval(enviarUna, NARRATIVA_INTERVAL_MS);
    }, 8000);
}

async function cancelarPorFaltaDeGente(client, guildId, channel) {
    const heist = heistsActivos.get(guildId);
    if (!heist || heist.fase !== 'uniendo') return;
    limpiarTimers(heist);
    heistsActivos.delete(guildId);
    if (channel) {
        await channel.send({
            content: E.cruz + ' El robo fue **cancelado**: no se alcanzó el mínimo de 2 personas.'
        }).catch(() => null);
    }
}

async function iniciarFaseRobo(client, guildId, channel) {
    const heist = heistsActivos.get(guildId);
    if (!heist || heist.fase !== 'uniendo') return;
    if (heist.participantes.size < MIN_PERSONAS) {
        await cancelarPorFaltaDeGente(client, guildId, channel);
        return;
    }

    heist.fase = 'en_curso';
    if (heist.timeoutUnion) clearTimeout(heist.timeoutUnion);
    heist.timeoutUnion = null;

    const menciones = [...heist.participantes].map((id) => `<@${id}>`).join(', ');
    const finUnix = Math.floor((Date.now() + TIEMPO_ROBO_MS) / 1000);

    const embed = new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(E.warn + ' Robo al banco en curso')
        .setDescription(
            `El equipo entró al banco. La policía puede intervenir.\n\n` +
                `${E.dot} **Participantes:** ${menciones}\n` +
                `${E.dot} **Ventana de intervención:** termina <t:${finUnix}:R>\n` +
                `${E.dot} **Policía / Alto Mando:** \`/robar-banco intervenir\``
        )
        .setTimestamp();

    if (channel) await channel.send({ embeds: [embed] }).catch(() => null);
    iniciarNarrativaRobo(channel, heist);

    heist.timeoutRobo = setTimeout(async () => {
        await resolverRobo(client, guildId);
    }, TIEMPO_ROBO_MS);
}

async function resolverRobo(client, guildId) {
    const heist = heistsActivos.get(guildId);
    if (!heist || heist.fase !== 'en_curso') return;

    limpiarTimers(heist);
    heist.fase = 'finalizado';

    const channel = await client.channels.fetch(heist.channelId).catch(() => null);
    const logs = await client.channels.fetch(CHANNEL_LOGS).catch(() => null);
    const participantes = [...heist.participantes];
    const menciones = participantes.map((id) => `<@${id}>`).join(', ');

    for (const id of participantes) {
        await aplicarCooldown(id);
    }

    const exito = Math.random() * 100 < CHANCE_EXITO;

    if (exito) {
        const total = generarRecompensa();
        const porPersona = Math.floor(total / participantes.length);
        for (const id of participantes) {
            await agregarSaldo(id, porPersona, { tipo: 'INGRESO', motivo: 'Robo al banco exitoso' });
        }

        const embed = new EmbedBuilder()
            .setColor(PRIMARIO)
            .setTitle(E.tilde + ' ¡Robo al banco exitoso!')
            .setDescription(
                `El equipo salió con el botín.\n\n` +
                    `${E.dot} **Participantes:** ${menciones}\n` +
                    `${E.dot} **Botín total:** $${total.toLocaleString('es-AR')}\n` +
                    `${E.dot} **Por persona:** $${porPersona.toLocaleString('es-AR')}\n` +
                    `${E.dot} **Chance de éxito:** ${CHANCE_EXITO}%`
            )
            .setTimestamp();

        if (channel) await channel.send({ embeds: [embed] }).catch(() => null);
        if (logs) {
            await logs.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(PRIMARIO)
                        .setTitle(E.form + ' Log — Robo al banco EXITOSO')
                        .setDescription(
                            `${E.dot} **Participantes:** ${menciones}\n` +
                                `${E.dot} **Botín total:** $${total.toLocaleString('es-AR')}\n` +
                                `${E.dot} **Por persona:** $${porPersona.toLocaleString('es-AR')}`
                        )
                        .setTimestamp()
                ]
            }).catch(() => null);
        }
    } else {
        const embed = new EmbedBuilder()
            .setColor(PRIMARIO)
            .setTitle(E.cruz + ' Robo al banco fallido')
            .setDescription(
                `La policía llegó a tiempo. Nadie se lleva el botín.\n\n` +
                    `${E.dot} **Participantes:** ${menciones}\n` +
                    `${E.dot} **Chance de éxito:** ${CHANCE_EXITO}%\n` +
                    `${E.dot} **Cooldown:** 12 horas`
            )
            .setTimestamp();

        if (channel) await channel.send({ embeds: [embed] }).catch(() => null);
        if (logs) {
            await logs.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(PRIMARIO)
                        .setTitle(E.manual + ' Log — Robo al banco FALLIDO')
                        .setDescription(`${E.dot} **Participantes:** ${menciones}`)
                        .setTimestamp()
                ]
            }).catch(() => null);
        }
    }

    heistsActivos.delete(guildId);
}

export default {
    data: new SlashCommandBuilder()
        .setName('robar-banco')
        .setDescription('Organiza un robo al banco con otros jugadores.')
        .addSubcommand((s) =>
            s.setName('iniciar').setDescription('Inicia un robo al banco (fase de unión).')
        )
        .addSubcommand((s) =>
            s.setName('unirse').setDescription('Unite a un robo al banco en fase de unión.')
        )
        .addSubcommand((s) =>
            s
                .setName('intervenir')
                .setDescription('Policía / Alto Mando: frustra el robo en curso.')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const usuarioId = interaction.user.id;

        if (sub === 'intervenir') {
            if (!puedeIntervenir(interaction.member)) {
                return interaction.reply({
                    content: E.cruz + ' Solo **Policía** o **Alto Mando** pueden intervenir un robo al banco.',
                    ephemeral: true
                });
            }

            const cdInt = await estaEnCooldownIntervenir(usuarioId);
            if (cdInt) {
                const ts = Math.floor(cdInt / 1000);
                return interaction.reply({
                    content: `${E.lock} Todavía estás en cooldown de intervención. Podrás volver a intervenir <t:${ts}:R>.`,
                    ephemeral: true
                });
            }

            const heist = heistsActivos.get(guildId);
            if (!heist) {
                return interaction.reply({
                    content: E.cruz + ' No hay ningún robo al banco activo en este momento.',
                    ephemeral: true
                });
            }

            if (heist.fase === 'uniendo') {
                return interaction.reply({
                    content:
                        E.cruz + ' El robo todavía está en fase de **unión**. Solo podés intervenir cuando el equipo ya entró al banco (fase en curso).',
                    ephemeral: true
                });
            }

            if (heist.fase !== 'en_curso') {
                return interaction.reply({
                    content: E.cruz + ' Este robo ya no se puede intervenir.',
                    ephemeral: true
                });
            }

            limpiarTimers(heist);
            heist.fase = 'finalizado';

            const participantes = [...heist.participantes];
            const menciones = participantes.map((id) => `<@${id}>`).join(', ');

            for (const id of participantes) {
                await aplicarCooldown(id);
            }
            await aplicarCooldownIntervenir(usuarioId);

            const embed = new EmbedBuilder()
                .setColor(PRIMARIO)
                .setTitle(E.esposas + ' Robo frustrado por la policía')
                .setDescription(
                    `La intervención policial terminó el asalto.\n\n` +
                        `${E.dot} **Oficial:** <@${interaction.user.id}>\n` +
                        `${E.dot} **Sospechosos:** ${menciones}\n` +
                        `${E.dot} **Botín:** ninguno\n` +
                        `${E.dot} **Cooldown participantes:** 12 horas`
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            const logs = await interaction.client.channels.fetch(CHANNEL_LOGS).catch(() => null);
            if (logs) {
                await logs.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(PRIMARIO)
                            .setTitle(E.form + ' Log — Intervención policial (robo al banco)')
                            .setDescription(
                                `${E.dot} **Oficial:** <@${interaction.user.id}>\n` +
                                    `${E.dot} **Sospechosos:** ${menciones}`
                            )
                            .setTimestamp()
                    ]
                }).catch(() => null);
            }

            heistsActivos.delete(guildId);
            return;
        }

        if (sub === 'iniciar') {
            const cooldown = await estaEnCooldown(usuarioId);
            if (cooldown) {
                const ts = Math.floor(cooldown / 1000);
                return interaction.reply({
                    content: `${E.lock} Todavía estás en cooldown de robar el banco. Podrás volver a participar <t:${ts}:R>.`,
                    ephemeral: true
                });
            }

            if (heistsActivos.has(guildId)) {
                return interaction.reply({
                    content:
                        E.cruz + ' Ya hay un robo al banco en este servidor. Usá `/robar-banco unirse` si está en fase de unión, o esperá a que termine.',
                    ephemeral: true
                });
            }

            const heist = {
                guildId,
                channelId: interaction.channelId,
                iniciador: usuarioId,
                participantes: new Set([usuarioId]),
                fase: 'uniendo',
                timeoutUnion: null,
                timeoutRobo: null,
                intervaloNarrativa: null
            };
            heistsActivos.set(guildId, heist);

            const finUnion = Math.floor((Date.now() + TIEMPO_UNION_MS) / 1000);
            const embed = new EmbedBuilder()
                .setColor(PRIMARIO)
                .setTitle(E.ski + ' Robo al banco iniciado')
                .setDescription(
                    `<@${usuarioId}> armó un equipo para el banco.\n\n` +
                        `${E.dot} **Participantes:** 1/${MAX_PERSONAS}\n` +
                        `${E.dot} **Mínimo requerido:** ${MIN_PERSONAS}\n` +
                        `${E.dot} **Tiempo para unirse:** termina <t:${finUnion}:R>\n` +
                        `${E.dot} **Después:** el robo entra en curso y la policía puede \`/robar-banco intervenir\`\n\n` +
                        `Usá \`/robar-banco unirse\` para sumarte.`
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            heist.timeoutUnion = setTimeout(async () => {
                const actual = heistsActivos.get(guildId);
                if (!actual || actual.fase !== 'uniendo') return;
                const channel = await interaction.client.channels
                    .fetch(actual.channelId)
                    .catch(() => null);
                if (actual.participantes.size < MIN_PERSONAS) {
                    await cancelarPorFaltaDeGente(interaction.client, guildId, channel);
                } else {
                    await iniciarFaseRobo(interaction.client, guildId, channel);
                }
            }, TIEMPO_UNION_MS);
            return;
        }

        if (sub === 'unirse') {
            const heist = heistsActivos.get(guildId);
            if (!heist) {
                return interaction.reply({
                    content:
                        E.cruz + ' No hay ningún robo al banco activo. Usá `/robar-banco iniciar` para comenzar uno.',
                    ephemeral: true
                });
            }

            if (heist.fase !== 'uniendo') {
                return interaction.reply({
                    content:
                        E.cruz + ' El robo ya no acepta más integrantes (ya está en curso o finalizó).',
                    ephemeral: true
                });
            }

            const cooldown = await estaEnCooldown(usuarioId);
            if (cooldown) {
                const ts = Math.floor(cooldown / 1000);
                return interaction.reply({
                    content: `${E.lock} Todavía estás en cooldown de robar el banco. Podrás volver a participar <t:${ts}:R>.`,
                    ephemeral: true
                });
            }

            if (heist.participantes.has(usuarioId)) {
                return interaction.reply({
                    content: E.cruz + ' Ya estás participando de este robo.',
                    ephemeral: true
                });
            }

            if (heist.participantes.size >= MAX_PERSONAS) {
                return interaction.reply({
                    content: E.cruz + ' El robo al banco ya está completo (máximo 3 personas).',
                    ephemeral: true
                });
            }

            heist.participantes.add(usuarioId);
            const cantidad = heist.participantes.size;
            const menciones = [...heist.participantes].map((id) => `<@${id}>`).join(', ');

            await interaction.reply({
                content: `${E.tilde} Te uniste al robo. **Participantes (${cantidad}/${MAX_PERSONAS}):** ${menciones}`
            });

            if (cantidad >= MAX_PERSONAS) {
                setTimeout(async () => {
                    const actual = heistsActivos.get(guildId);
                    if (!actual || actual.fase !== 'uniendo') return;
                    const channel = await interaction.client.channels
                        .fetch(actual.channelId)
                        .catch(() => null);
                    if (!channel) return;
                    await iniciarFaseRobo(interaction.client, guildId, channel);
                }, 1500);
            }
        }
    }
};
