import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

// URL DE LA IMAGEN PREDETERMINADA PARA ROLEPLAY
const IMAGEN_RP_DEFECTO = 'https://cdn.discordapp.com/attachments/1517331229303902432/1524843450678116432/Lanzamiento_RP_2NUEVO3.png?ex=6a51e160&is=6a508fe0&hm=cca9367de3287bd9c34191f59eebbad3b96b48c58d266119050ed9f81b0182a2&';

// --- DICCIONARIO COMPLETO DE EMOJIS CUSTOM (00Y4n) ---
const EMOJIS = {
    link: '<:link00y4n:1519476984932073482>',
    cruz: '<:cruz00y4n:1519476959606734998>',
    warn: '<:warn00y4n:1519476933988061295>',
    cirPunto: '<:00y4ncirpunto:1519474782117171392>',
    flechaH: '<:FlechaHoriz00Y4n:1519474590370500608>',
    flechaV: '<:Flecha_00Y4n:1519473149845045400>',
    star: '<:star00y4n:1519474745320669194>',
    coraMov: '<a:Cora_Mov_00Y4n:1519473208334749716>'
};

export default {
    data: {
        name: 'lanzar_rp',
        description: 'Liberas los accesos para una sesión oficial de Roleplay.',
        options: [
            { name: 'mensaje_id', description: 'Pegá acá la ID del mensaje de Startup/Inicio de esta sesión.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'acceso', description: 'Pegá acá el enlace del servidor privado de Roblox.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'limite_velocidad', description: 'Ejemplo: 75 MPH / 80 MPH', type: ApplicationCommandOptionType.String, required: true },
            { name: 'peacetime', description: 'Ejemplo: On / Off', type: ApplicationCommandOptionType.String, required: true },
            { name: 'imagen', description: 'Link de la foto/banner para la apertura (opcional).', type: ApplicationCommandOptionType.String, required: false }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Bloqueo de Staff
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: `<:cruz:1523041302764191844> **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesión.`,
                ephemeral: true
            });
        }

        // 📝 Obtenemos la ID de forma manual desde las opciones
        const idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');
        const limite = interaction.options.getString('limite_velocidad');
        const peacetime = interaction.options.getString('peacetime');
        const urlImagen = interaction.options.getString('imagen');

        // Diseño visual Premium unificado
        const infoDescripcion = 
            `> <:punto:1523041306836996156> <@${interaction.user.id}> ¡ha lanzado su sesión! Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
            ` <:flor:1523041315187855470> **Antes de Unirte**\n\n` +
            `> <:fle:1523041359441952970> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
            `> <:fle:1523041359441952970> Lee la [información](https://discord.com/channels/1451939725308067842/1516590524725989437) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1525190667545088225).\n` +
            `> <:fle:1523041359441952970> Registra tus vehículos en <#1505615426305130657>!\n\n` +
            ` <:flor:1523041315187855470> **Información del Roleplay**\n\n` +
            `> <:uno:1523028217592676464> **Estado de Peacetime:** ${peacetime}\n` +
            `> <:dos:1523027468385128568> **Velocidad de Fail Roleplay:** ${limite}\n` +
            `> <:replica:1523028004983406787> Las velocidades de detención son **+6 MPH** sobre el límite de velocidad establecido.\n\n` +
            `<a:adv:1523027438030946446> *¡Cualquier miembro descubierto haciendo Fail Roleplay de forma excessive será expulsado inmediatamente de la sesión!*`;

        const embedRelease = new EmbedBuilder()
            .setTitle(`<a:confeti:1523026892981145600> Southwest Florida - *_Roleplay Sesión Lanzada_* <a:confeti:1523026892981145600>`)
            .setDescription(infoDescripcion)
            .setColor('#74d4fc');

        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else if (IMAGEN_RP_DEFECTO !== '') {
            embedRelease.setImage(IMAGEN_RP_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('1524936452574806076') // ID de tu emoji estático de enlace
        );

        await interaction.reply({ content: 'Liberando accesos de Roleplay...', ephemeral: true });

        const msgRelease = await interaction.channel.send({
            content: '@everyone <@&1503763201274413056>',
            embeds: [embedRelease],
            components: [fila]
        });

        // Guardamos los datos mapeando de forma segura
        global.coleccionSesiones.set(msgRelease.id, { 
            idInicio, 
            linkSesion,
            guildId: interaction.guildId,
            tipo: 'rp'
        });
    }
};

