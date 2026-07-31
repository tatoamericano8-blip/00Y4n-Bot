import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} from 'discord.js';
import { agregarSaldo, obtenerSaldo } from '../../utils/gestorEconomia.js';
import { getFromDb, setInDb } from '../../utils/database.js';

const ROL_POLICIA_ID = '1529146302783422706';
const ROL_WARRANT_ID = '1529152491545952316';
const CHANNEL_LOGS = '1529175493029531738';

const TIEMPO_UNION_MS = 80 * 1000;          // 80 segundos
const COOLDOWN_MS = 12 * 60 * 60 * 1000;    // 12 horas
const MIN_PERSONAS = 2;
const MAX_PERSONAS = 3;
const RECOMPENSA_MIN = 10000;
const RECOMPENSA_MAX = 25000;

// heistsActivos: guildId -> datos del heist
const heistsActivos = new Map();

function generarRecompensa() {
    return Math.floor(Math.random() * (RECOMPENSA_MAX - RECOMPENSA_MIN + 1)) + RECOMPENSA_MIN;
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

async function contarPoliciasOnline(guild) {
    try {
        const miembros = await guild.members.fetch({ withPresences: true }).catch(() => null);
        if (!miembros) return 0;

        let count = 0;
        for (const [, member] of miembros) {
            if (
                member.roles.cache.has(ROL_POLICIA_ID) &&
                member.presence &&
                ['online', 'idle', 'dnd'].includes(member.presence.status)
            ) {
                count++;
            }
        }
        return count;
    } catch {
        return 0;
    }
}

function calcularChanceExito(policiasOnline) {
    // Base 60%. Cada policía online reduce un poco la chance
    let chance = 60;
    if (policiasOnline >= 1) chance -= 15;
    if (policiasOnline >= 3) chance -= 15;
    return Math.max(25, chance); // mínimo 25%
}

async function resolverHeist(interaction, heist) {
    const { participantes, channelId, leaderId } = heist;
    const lista = [...participantes];

    // Aplicar cooldown a todos
    for (const id of lista) {
        await aplicarCooldown(id);
    }

    const policiasOnline = await contarPoliciasOnline(interaction.guild);
    const chanceExito = calcularChanceExito(policiasOnline);
    const exito = Math.random() * 100 < chanceExito;

    const channel = interaction.guild.channels.cache.get(channelId);
    const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);

    if (exito) {
        const total = generarRecompensa();
        const porPersona = Math.floor(total / lista.length);

        for (const id of lista) {
            await agregarSaldo(id, porPersona);
        }

        const menciones = lista.map(id => `<@${id}>`).join(', ');

        const embedExito = new EmbedBuilder()
            .setColor('#57f287')
            .setTitle('🏦 ¡Robo al Banco exitoso!')
            .setDescription(
                `El equipo logró robar el banco de Sarasota.\n\n` +
                `• **Participantes:** ${menciones}\n` +
                `• **Botín total:** $${total.toLocaleString('es-AR')}\n` +
                `• **Por persona:** $${porPersona.toLocaleString('es-AR')}\n` +
                `• **Policías en línea:** ${policiasOnline}\n` +
                `• **Chance de éxito:** ${chanceExito}%`
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Sistema de Economía',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        if (channel) await channel.send({ embeds: [embedExito] });

        if (logsChannel) {
            await logsChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#57f287')
                        .setTitle('🏦 Robo al Banco Exitoso')
                        .setDescription(
                            `> **Líder:** <@${leaderId}>\n` +
                            `> **Participantes:** ${menciones}\n` +
                            `> **Botín:** $${total.toLocaleString('es-AR')}\n` +
                            `> **Policías online:** ${policiasOnline}`
                        )
                        .setTimestamp()
                ]
            });
        }
    } else {
        // Fracaso → asignar rol Warrant
        for (const id of lista) {
            try {
                const member = await interaction.guild.members.fetch(id).catch(() => null);
                if (member) await member.roles.add(ROL_WARRANT_ID).catch(() => null);
            } catch {}
        }

        const menciones = lista.map(id => `<@${id}>`).join(', ');
        const razonFallo = policiasOnline > 0
            ? `La policía intervino a tiempo (${policiasOnline} oficial/es en línea).`
            : 'El plan falló y fueron descubiertos.';

        const embedFallo = new EmbedBuilder()
            .setColor('#ed4245')
            .setTitle('🚨 Robo al Banco fallido')
            .setDescription(
                `${razonFallo}\n\n` +
                `• **Participantes:** ${menciones}\n` +
                `• **Resultado:** Todos recibieron una **Orden de Arresto**\n` +
                `• **Policías en línea:** ${policiasOnline}\n` +
                `• **Chance de éxito:** ${chanceExito}%`
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Sistema de Economía',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        if (channel) await channel.send({ embeds: [embedFallo] });

        if (logsChannel) {
            await logsChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ed4245')
                        .setTitle('🚨 Robo al Banco Fallido')
                        .setDescription(
                            `> **Líder:** <@${leaderId}>\n` +
                            `> **Participantes:** ${menciones}\n` +
                            `> **Motivo:** ${razonFallo}\n` +
                            `> **Policías online:** ${policiasOnline}`
                        )
                        .setTimestamp()
                ]
            });
        }
    }

    heistsActivos.delete(interaction.guildId);
}

export default {
    data: new SlashCommandBuilder()
        .setName('robar-banco')
        .setDescription('Organiza o únete a un robo al banco de Sarasota.')
        .addSubcommand(sub =>
            sub.setName('iniciar')
                .setDescription('Inicia un robo al Banco (necesitas 2-3 personas).')
        )
        .addSubcommand(sub =>
            sub.setName('unirse')
                .setDescription('Únete a un robo al banco activo en este servidor.')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const usuarioId = interaction.user.id;
        const guildId = interaction.guildId;

        // ─── INICIAR ───
        if (sub === 'iniciar') {
            // Cooldown
            const cooldown = await estaEnCooldown(usuarioId);
            if (cooldown) {
                const ts = Math.floor(cooldown / 1000);
                return interaction.reply({
                    content: `<:lock:1523041298796384418> Todavía estás en cooldown de robar el banco. Podrás volver a participar <t:${ts}:R>.`,
                    ephemeral: true
                });
            }

            // Ya hay un heist activo
            if (heistsActivos.has(guildId)) {
                return interaction.reply({
                    content: '❌ Ya hay un robo al banco en curso en este servidor. Usá `/robar-banco unirse` para sumarte.',
                    ephemeral: true
                });
            }

            // Crear heist
            const heist = {
                leaderId: usuarioId,
                participantes: new Set([usuarioId]),
                channelId: interaction.channelId,
                expiresAt: Date.now() + TIEMPO_UNION_MS
            };
            heistsActivos.set(guildId, heist);

            const embed = new EmbedBuilder()
                .setColor('#74d4fc')
                .setTitle('🏦 Robo al Banco iniciado – Banco de Sarasota')
                .setDescription(
                    `<@${usuarioId}> está organizando un **robo al banco**.\n\n` +
                    `• **Participantes:** 1/${MAX_PERSONAS}\n` +
                    `• **Mínimo requerido:** ${MIN_PERSONAS}\n` +
                    `• **Tiempo para unirse:** 80 segundos\n` +
                    `• **Recompensa:** $10.000 – $25.000 (dividido)\n` +
                    `• **Riesgo:** 40% de fallo → Orden de Arresto\n\n` +
                    `Usá \`/robar-banco unirse\` para sumarte.`
                )
                .setFooter({
                    text: '00Y4n Comunidad SWFL • Sistema de Economía',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Timer de 80 segundos
            setTimeout(async () => {
                const actual = heistsActivos.get(guildId);
                if (!actual) return;

                if (actual.participantes.size < MIN_PERSONAS) {
                    heistsActivos.delete(guildId);
                    try {
                        const channel = interaction.guild.channels.cache.get(actual.channelId);
                        if (channel) {
                            await channel.send({
                                content: '❌ El robo fue **cancelado**: no se alcanzó el mínimo de 2 personas.'
                            });
                        }
                    } catch {}
                    return;
                }

                // Resolver el heist
                await resolverHeist(interaction, actual);
            }, TIEMPO_UNION_MS);

            return;
        }

        // ─── UNIRSE ───
        if (sub === 'unirse') {
            const heist = heistsActivos.get(guildId);

            if (!heist) {
                return interaction.reply({
                    content: '❌ No hay ningún robo al banco activo en este momento. Usá `/robar-banco iniciar` para comenzar uno.',
                    ephemeral: true
                });
            }

            // Cooldown
            const cooldown = await estaEnCooldown(usuarioId);
            if (cooldown) {
                const ts = Math.floor(cooldown / 1000);
                return interaction.reply({
                    content: `<:lock:1523041298796384418> Todavía estás en cooldown de robar el banco. Podrás volver a participar <t:${ts}:R>.`,
                    ephemeral: true
                });
            }

            // Ya está adentro
            if (heist.participantes.has(usuarioId)) {
                return interaction.reply({
                    content: '❌ Ya estás participando de este robo.',
                    ephemeral: true
                });
            }

            // Lleno
            if (heist.participantes.size >= MAX_PERSONAS) {
                return interaction.reply({
                    content: '❌ El robo al banco ya está completo (máximo 3 personas).',
                    ephemeral: true
                });
            }

            // Unirse
            heist.participantes.add(usuarioId);
            const cantidad = heist.participantes.size;

            const menciones = [...heist.participantes].map(id => `<@${id}>`).join(', ');

            const embed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('🏦 Alguien se unió al robo')
                .setDescription(
                    `<@${usuarioId}> se sumó al robo.\n\n` +
                    `• **Participantes (${cantidad}/${MAX_PERSONAS}):** ${menciones}\n` +
                    `• **Tiempo restante:** unos segundos...`
                )
                .setFooter({
                    text: '00Y4n Comunidad SWFL • Sistema de Economía',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Si se llenó (3), resolver inmediatamente
            if (cantidad >= MAX_PERSONAS) {
                // Pequeña espera para que se vea el mensaje de unión
                setTimeout(async () => {
                    const actual = heistsActivos.get(guildId);
                    if (actual) await resolverHeist(interaction, actual);
                }, 1500);
            }
        }
    },
};
