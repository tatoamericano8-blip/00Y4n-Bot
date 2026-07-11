import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'supervisar_swfl',
        description: 'Anuncia públicamente quién está supervisando la sesión de Carmeet/Roleplay.',
        options: [
            {
                name: 'supervisor',
                description: 'El staff que supervisará. Si lo dejas en blanco, serás tú por defecto.',
                type: ApplicationCommandOptionType.User,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // Determinamos quién es el supervisor (el mencionado o el que escribió el comando)
        const supervisor = interaction.options.getUser('supervisor') || interaction.user;

        // Creamos el embed minimalista, traducido y con tu color celestito
        const embedSupervision = new EmbedBuilder()
            .setDescription(`<a:flecha:1523027371735777503> <@${supervisor.id}> está **supervisando** la sesión.`)
            .setColor('#74d4fc');

        // Enviamos el mensaje
        await interaction.reply({ 
            embeds: [embedSupervision] 
        });
    }
};
