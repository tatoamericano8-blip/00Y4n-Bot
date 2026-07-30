import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
const ROLE_STAFF = '1512120103771050005';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-announce')
        .setDescription('Envía un mensaje por privado (MD) a todos los usuarios con rol de Staff.')
        .addStringOption(opt => opt.setName('mensaje').setDescription('Contenido del aviso.').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> **Acceso Restringido:** Solo Alto Comando puede enviar comunicados globales por MD.',
                flags: MessageFlags.Ephemeral
            });
        }

        const mensaje = interaction.options.getString('mensaje');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await interaction.guild.members.fetch();
        const miembrosStaff = interaction.guild.members.cache.filter(m => m.roles.cache.has(ROLE_STAFF) && !m.user.bot);

        let enviados = 0;
        let fallidos = 0;

        const embedMD = new EmbedBuilder()
            .setTitle('📢 Comunicado Oficial de High Command')
            .setColor('#74d4fc')
            .setDescription(mensaje)
            .setFooter({ text: `Enviado por: ${interaction.user.tag}` })
            .setTimestamp();

        for (const [id, member] of miembrosStaff) {
            try {
                await member.send({ embeds: [embedMD] });
                enviados++;
            } catch (err) {
                fallidos++;
            }
        }

        await interaction.editReply({
            content: `<a:verificacion:1523027148326047878> Anuncio procesado:\n> **Entregados:** \`${enviados}\` miembros.\n> **MDs Bloqueados:** \`${fallidos}\` miembros.`
        });
    }
};
