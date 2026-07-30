import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { randomBytes } from 'crypto';
import Staff from '../../../models/Staff.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
const CHANNEL_LOGS = '1505015805891579934';

// 🎯 IDs de los roles de Staff Strike
const ROLES_STRIKE = {
    1: '1532457181696364544', // Staff Strike 1/3
    2: '1532457243315011806', // Staff Strike 2/3
    3: '1532457348818272506'  // Staff Strike 3/3
};

async function sincronizarRolesStrike(member, strikesActivos) {
    if (!member) return;
    const listaRolesStrike = Object.values(ROLES_STRIKE);

    try {
        await member.roles.remove(listaRolesStrike).catch(() => null);
        const rolAsignar = ROLES_STRIKE[strikesActivos] || (strikesActivos >= 3 ? ROLES_STRIKE[3] : null);

        if (rolAsignar) {
            await member.roles.add(rolAsignar).catch(() => null);
        }
    } catch (error) {
        console.error('Error al sincronizar roles de strike:', error);
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('staffstrike')
        .setDescription('Gestiona las sanciones del equipo de Staff.')
        .addSubcommand(sub =>
            sub.setName('aplicar')
                .setDescription('Aplica una sanción a un miembro del equipo.')
                .addUserOption(opt => opt.setName('usuario').setDescription('Staff a sancionar.').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Motivo de la sanción.').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remover')
                .setDescription('Remueve una sanción activa.')
                .addUserOption(opt => opt.setName('usuario').setDescription('Staff al que se le remueve el strike.').setRequired(true))
                .addStringOption(opt => opt.setName('id_strike').setDescription('ID del strike a remover.').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Motivo de la remoción.').setRequired(true))
        ),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> **Permisos insuficientes:** Solo High Command puede gestionar sanciones.',
                flags: MessageFlags.Ephemeral
            });
        }

        const sub = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        let staffData = await Staff.findOne({ guildId: interaction.guildId, userId: targetUser.id });
        if (!staffData) {
            return await interaction.reply({ 
                content: '<:cruz00y4n:1523041302764191844> El usuario no posee registro de Staff en la base de datos.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        await interaction.deferReply();
        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (sub === 'aplicar') {
            const idStrike = `STK-${randomBytes(3).toString('hex').toUpperCase()}`;
            staffData.strikes.push({
                idStrike,
                motivo,
                aplicadoPor: interaction.user.id,
                activo: true,
                fecha: new Date()
            });

            staffData.markModified('strikes');
            await staffData.save();

            const strikesActivos = staffData.strikes.filter(s => s.activo).length;
            await sincronizarRolesStrike(targetMember, strikesActivos);

            const embedLog = new EmbedBuilder()
                .setTitle('<:advertencia:1525172022475489472> Sanción Aplicada – Staff Strike')
                .setColor(strikesActivos >= 3 ? '#992d22' : '#ed4245')
                .setDescription(
                    `> **Staff Sancionado:** <@${targetUser.id}>\n` +
                    `> **ID de Strike:** \`${idStrike}\`\n` +
                    `> **Motivo:** ${motivo}\n` +
                    `> **Sancionado por:** <@${interaction.user.id}>\n` +
                    `> **Strikes Activos Actuales:** \`${strikesActivos}/3\`\n` +
                    (strikesActivos >= 3 ? '\n⚠️ **ATENCIÓN:** El usuario ha alcanzado el límite máximo de 3/3 strikes activos (Proceso de Baja/Unstaff requerido).' : '')
                )
                .setTimestamp();

            if (logsChannel) await logsChannel.send({ embeds: [embedLog] });

            let mensajeRespuesta = `<a:verificacion:1523027148326047878> Strike \`${idStrike}\` aplicado correctamente a <@${targetUser.id}>. Total activos: **${strikesActivos}/3**.`;
            if (strikesActivos >= 3) {
                mensajeRespuesta += '\n🚨 **ALERTA:** Este miembro ha alcanzado los **3 strikes**. Se recomienda evaluar su expulsión del equipo de Staff.';
            }

            await interaction.editReply({ content: mensajeRespuesta });

        } else if (sub === 'remover') {
            const idStrike = interaction.options.getString('id_strike');
            const strikeObj = staffData.strikes.find(s => s.idStrike === idStrike && s.activo);

            if (!strikeObj) {
                return await interaction.editReply({ 
                    content: `<a:cruz00y4n:1523027120538910830> No se encontró un strike activo con el ID \`${idStrike}\` para este usuario.` 
                });
            }

            strikeObj.activo = false;
            strikeObj.removidoPor = interaction.user.id;
            strikeObj.fechaRemovido = new Date();
            strikeObj.motivoRemocion = motivo;

            staffData.markModified('strikes');
            await staffData.save();

            const strikesActivos = staffData.strikes.filter(s => s.activo).length;
            await sincronizarRolesStrike(targetMember, strikesActivos);

            const embedLog = new EmbedBuilder()
                .setTitle('<a:verificacion:1523027148326047878> Sanción Removida – Staff Strike')
                .setColor('#57f287')
                .setDescription(
                    `> **Staff:** <@${targetUser.id}>\n` +
                    `> **ID de Strike Removido:** \`${idStrike}\`\n` +
                    `> **Motivo Remoción:** ${motivo}\n` +
                    `> **Removido por:** <@${interaction.user.id}>\n` +
                    `> **Strikes Activos Restantes:** \`${strikesActivos}/3\``
                )
                .setTimestamp();

            if (logsChannel) await logsChannel.send({ embeds: [embedLog] });

            await interaction.editReply({
                content: `<a:verificacion:1523027148326047878> El strike \`${idStrike}\` fue desactivado correctamente. Total activos: **${strikesActivos}/3**.`
            });
        }
    }
};
