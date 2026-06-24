import { EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'reglas_swfl',
        description: 'Muestra las reglas vigentes de la sesión y las normas de generación de vehículos.',
    },

    async execute(interaction) {
        const linkComunidad = 'https://www.roblox.com/es/communities/292739785/Clan-00Y4n#!/about';

        // --- MAPEO DIRECTO DESDE TUS IMÁGENES ---
        // Animados (image_f761a3.png)
        const eCoraMov   = '<a:coraamov00y4n:1519475012283666554>'; 
        
        // Estáticos (image_f75968.png)
        const ePunto     = '<:00y4ncirpunto:1519474782117171392>';
        const eCruz      = '<:cruz00y4n:1519476959606734998>';
        const eWarn      = '<:warn00y4n:1519476933988061295>';
        const eTilde     = '<:tilde00y4n:1519476900995666101>';
        const eStar      = '<:star00Y4n:1519474745320669194>';
        const eFlechaH   = '<:FlechaHoriz00Y4n:1519474590370500608>';
        const eFlechaV   = '<:Flecha_00Y4n:1519473149845045400>';
        const eLink      = '<:link00y4n:1519476984932073482>';

        const embedReglas = new EmbedBuilder()
            .setTitle(`${eCoraMov} Reglas de la sesión, vigentes de inmediato. ${eCoraMov}`)
            .setDescription(
                `${ePunto} **Si chocas**, __detente y comparte__ la información. Simplemente escribe algo como "-_intercambio_-" en el chat y luego podrás continuar.\n\n` +
                `${eCruz} Conducir de **forma temeraria** resultará en la expulsión inmediata del juego. Asegúrate de conducir de forma realista y sensata en __todo__ momento.\n\n` +
                `${eWarn} Está prohibido exceder el **límite de velocidad**. Debes respetar las señales del juego y, si te pillan superando el límite de velocidad permitido, serás expulsado inmediatamente.\n\n` +
                `${eTilde} Debes __activar__ las **colisiones de vehículos**. Para ello, ve a Ajustes > Vehículo > Colisiones de vehículos y _actívalas_. Si no lo haces, serás _expulsado inmediatamente_ del juego.\n\n` +
                `${eCruz} No se permiten **vehículos prohibidos**. Sin embargo, si un miembro del equipo te indica que cambies de vehículo, hazlo. Si no sigues las instrucciones del equipo, serás expulsado inmediatamente de la sesión.`
            )
            .addFields(
                {
                    name: `${eStar} Normativa de Generación de Vehículos`,
                    value: `> ${eFlechaH} Solo puedes generar tus vehículos en el concesionario, tu casa, la casa de un amigo o tu trabajo. El incumplimiento de estas reglas conllevará una infracción o restricción.`
                },
                {
                    name: `${eLink} Grupo de Roblox Requerido`,
                    value: `> ${eFlechaV} **Todos** los usuarios deben unirse a nuestro grupo de Roblox antes de participar en una sesión de rol. ¡[Comunidad de Roblox 00Y4n](${linkComunidad})!`
                }
            )
            .setColor('#ff6600') // Color naranja característico
            .setFooter({ 
                text: `${interaction.guild.name} | Normas Oficiales`, 
                iconURL: interaction.guild.iconURL() 
            })
            .setTimestamp();

        return await interaction.reply({ embeds: [embedReglas] });
    }
};
