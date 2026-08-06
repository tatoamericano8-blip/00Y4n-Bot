import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Vehiculo from '../../../models/Vehiculo.js';

export default {
    data: new SlashCommandBuilder()
        .setName('buscar-patente')
        .setDescription('Busca información de un vehículo por su matrícula (Exclusivo Policía).')
        .addStringOption(option =>
            option.setName('patente')
                .setDescription('Matrícula del vehículo a consultar.')
                .setRequired(true)),

    async execute(interaction) {
        const ROL_POLICIA_ID = '1529146302783422706';

        if (!interaction.member.roles.cache.has(ROL_POLICIA_ID)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Solo los oficiales del **Departamento Policial del Condado de Sarasota** pueden usar este comando.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const patente = interaction.options.getString('patente').toUpperCase();

        try {
            const vehiculo = await Vehiculo.findOne({ patente: patente });

            if (!vehiculo) {
                return await interaction.editReply({
                    content: `❌ No se encontró ningún vehículo registrado con la matrícula \`${patente}\`.`
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#74d4fc')
                .setTitle('<:folder:1523041319046479964> Consulta de Patente')
                .setDescription(
                    `• **Matrícula -** \`${vehiculo.patente}\`\n` +
                    `• **Marca -** ${vehiculo.marca}\n` +
                    `• **Modelo -** ${vehiculo.modelo}\n` +
                    `• **Año -** ${vehiculo.anio}\n` +
                    `• **Color -** ${vehiculo.color}\n` +
                    `• **Propietario -** <@${vehiculo.usuario_id}>`
                )
                .setFooter({
                    text: '00Y4n Comunidad SWFL • Departamento Policial de Sarasota',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error buscando patente:', error);
            await interaction.editReply({
                content: '❌ Ocurrió un error interno al consultar la patente.'
            });
        }
    },
};
