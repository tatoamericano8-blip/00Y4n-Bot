import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { getFromDb, setInDb } from '../../utils/database.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
const ROLE_STAFF = '1512120103771050005';
const ROLE_LOA = '1532459272690991318';
const CHANNEL_LOGS = '1505015805891579934';

// Roles de Staff Strike + LOA + Staff general (se quitan todos al terminar)
const ROLES_A_QUITAR = [
    ROLE_STAFF,
    ROLE_LOA,
    '1532457181696364544', // Staff Strike 1/3
    '1532457243315011806', // Staff Strike 2/3
    '1532457348818272506'  // Staff Strike 3/3
];

const KEY_BLACKLIST = (guildId) => `staff:blacklist:${guildId}`;

export async function estaEnBlacklistStaff(guildId, userId) {
    const lista = await getFromDb(KEY_BLACKLIST(guildId), []);
    return Array.isArray(lista) && lista.some(e => e.userId === userId);
}

export async function agregarBlacklistStaff(guildId, entry) {
    const lista = await getFromDb(KEY_BLACKLIST(guildId), []);
    const arr = Array.isArray(lista) ? lista : [];
    // Evitar duplicados
    if (arr.some(e => e.userId === entry.userId)) return arr;
    arr.push(entry);
    await setInDb(KEY_BLACKLIST(guildId), arr);
    return arr;
}

export default {
    data: new SlashCommandBuilder()
        .setName('terminate')
        .setDescription('Destituye / despide a un integrante del equipo de Staff.')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('El miembro del Staff a destituir.')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('motivo')
                .setDescription('Motivo de la destitución.')
                .setRequired(true))
        .addBooleanOption(opt =>
            opt.setName('blacklist')
                .setDescription('¿Agregarlo a la blacklist de Staff? (no podrá ser recontratado)')
                .setRequired(false)),

    async execute(interaction) {
        if (
            !interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> **Permisos insuficientes:** Solo Alto Comando puede ejecutar destituciones.',
                flags: MessageFlags.Ephemeral
            });
        }

        const targetUser = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');
        const ponerBlacklist = interaction.options.getBoolean('blacklist') ?? false;

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ No podés destituirte a vos mismo.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Quitar todos los roles de staff conocidos
        const rolesQuitados = [];
        if (targetMember) {
            for (const roleId of ROLES_A_QUITAR) {
                if (targetMember.roles.cache.has(roleId)) {
                    try {
                        await targetMember.roles.remove(roleId);
                        rolesQuitados.push(roleId);
                    } catch {
                        // Sin permisos o rol por encima del bot
                    }
                }
            }
        }

        // Actualizar DB de Staff
        let staffData = await Staff.findOne({
            guildId: interaction.guildId,
            userId: targetUser.id
        });

        if (staffData) {
            staffData.estado = 'DESPEDIDO';
            staffData.despido = {
                fecha: new Date(),
                motivo,
                realizadoPor: interaction.user.id,
                blacklist: ponerBlacklist
            };
            // Desactivar strikes activos (ya no es staff)
            if (Array.isArray(staffData.strikes)) {
                for (const s of staffData.strikes) {
                    if (s.activo) {
                        s.activo = false;
                        s.removidoPor = interaction.user.id;
                        s.fechaRemovido = new Date();
                        s.motivoRemocion = 'Destitución de Staff';
                    }
                }
                staffData.markModified('strikes');
            }
            // Cerrar LOA si estaba activa
            if (staffData.loa?.activo) {
                staffData.loa.activo = false;
            }
            await staffData.save();
        }

        // Blacklist persistente
        if (ponerBlacklist) {
            await agregarBlacklistStaff(interaction.guildId, {
                userId: targetUser.id,
                motivo,
                agregadoPor: interaction.user.id,
                fecha: new Date().toISOString()
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('<:estrechar:1534937065089663068> Destitución de Staff')
            .setColor('#ed4245')
            .setDescription(
                `> <:dot:1534938142665084938> **Usuario destituido:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
                `> <:dot:1534938142665084938> **Motivo:** ${motivo}\n` +
                `> <:dot:1534938142665084938> **Ejecutado por:** <@${interaction.user.id}>\n` +
                `> <:dot:1534938142665084938> **Blacklist:** ${ponerBlacklist ? '🚨 **SÍ** – no podrá ser recontratado' : 'No'}\n` +
                `> <:dot:1534938142665084938> **Roles removidos:** \`${rolesQuitados.length}\`\n` +
                `> <:dot:1534938142665084938> **Fecha:** <t:${Math.floor(Date.now() / 1000)}:F>`
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setFooter({
                text: '00Y4n Comunidad SWFL • Gestión de Staff',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
        if (logsChannel) await logsChannel.send({ embeds: [embed] });

        await interaction.editReply({
            content:
                `<:verificacion:1534937809733812286> <@${targetUser.id}> fue destituido del equipo de Staff.` +
                (ponerBlacklist ? ' Fue agregado a la **blacklist** de Staff.' : ''),
            embeds: [embed]
        });

        // DM al destituido
        try {
            await targetUser.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ed4245')
                        .setTitle('Destitución del equipo de Staff')
                        .setDescription(
                            `Fuiste destituido del equipo de Staff de **${interaction.guild.name}**.\n\n` +
                            `<:dot:1534938142665084938> **Motivo:** ${motivo}\n` +
                            (ponerBlacklist
                                ? '<:dot:1534938142665084938> **Blacklist:** Sí. No podrás volver a ser parte del Staff.\n'
                                : '') +
                            `<:dot:1534938142665084938> **Fecha:** <t:${Math.floor(Date.now() / 1000)}:F>`
                        )
                        .setFooter({ text: '00Y4n Comunidad SWFL' })
                        .setTimestamp()
                ]
            });
        } catch {
            // DMs cerrados
        }
    }
};
