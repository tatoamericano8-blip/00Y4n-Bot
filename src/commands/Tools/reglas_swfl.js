import { EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'reglas_swfl',
        description: 'Muestra las reglas vigentes de la sesión y las normas de generación de vehículos.',
    },

    async execute(interaction) {
        // Enlace oficial de tu comunidad provisto
        const linkComunidad = 'https://www.roblox.com/es/communities/292739785/Clan-00Y4n#!/about';

        const embedReglas = new EmbedBuilder()
            .setTitle('📋 Reglas de la sesión, vigentes de inmediato. 🍂🍂')
            .setDescription(
                `• **Si chocas**, __detente y comparte__ la información . Simplemente escribe algo como "-_intercambio_-" en el chat y luego podrás continuar.\n\n` +
                `• Conducir de **forma temeraria** resultará en la expulsión inmediata del juego. Asegúrate de conducir de forma realista y sensata en __todo__ momento.\n\n` +
                `• Está prohibido exceder el **límite de velocidad**. Debes respetar las señales del juego y, si te pillan superando el límite de velocidad permitido, serás expulsado inmediatamente.\n\n` +
                `• Debes __activar__ las **colisiones de vehículos**. Para ello, ve a Ajustes > Vehículo > Colisiones de vehículos y _actívalas_. Si no lo haces, serás _expulsado inmediatamente_ del juego.\n\n` +
                `• No se permiten **vehículos prohibidos**. Sin embargo, si un miembro del equipo te indica que cambies de vehículo, hazlo. Si no sigues las instrucciones del equipo, serás expulsado inmediatamente de la sesión.`
            )
            .addFields(
                {
                    name: '🚗 Normativa de Generación de Vehículos',
                    value: `> 💥 Solo puedes generar tus vehículos en el concesionario, tu casa, la casa de un amigo o tu trabajo. El incumplimiento de estas reglas conllevará una infracción o restricción.`
                },
                {
                    name: '🌐 Grupo de Roblox Requerido',
                    value: `> 📙 **Todos** los usuarios deben unirse a nuestro grupo de Roblox antes de participar en una sesión de rol. ¡[Comunidad de Roblox 00Y4n](${linkComunidad})!`
                }
            )
            .setColor('#ff6600') // Tu color naranja insignia
            .setFooter({ 
                text: `${interaction.guild.name} | Normas Oficiales`, 
                iconURL: interaction.guild.iconURL() 
            })
            .setTimestamp();

        return await interaction.reply({ embeds: [embedReglas] });
    }
};
