import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';

global.coleccionStartups = global.coleccionStartups || new Map();

export default {
    data: {
        name: 'inicio_swfl',
        description: 'Lanza un inicio de sesión de Roleplay o Car Meet para SWFL.',
        options: [
            {
                name: 'tipo',
                description: '¿Qué tipo de sesión vas a iniciar?',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Roleplay', value: 'rp' },
                    { name: 'Car Meet', value: 'meet' }
                ]
            },
            { 
                name: 'reacciones', 
                description: 'Cantidad de reacciones necesarias para abrir.', 
                type: ApplicationCommandOptionType.Integer, 
                required: true 
            },
            { 
                name: 'imagen', 
                description: 'Link de la foto/banner para el anuncio (opcional).', 
                type: ApplicationCommandOptionType.String, 
                required: false 
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ **No tienes permisos:** Solo el Staff autorizado puede iniciar sesiones.',
                ephemeral: true
            });
        }

        const tipo = interaction.options.getString('tipo');
        const reacciones = interaction.options.getInteger('reacciones');
        const urlImagen = interaction.options.getString('imagen');

        const ePunto = '<:00y4ncirpunto:1523041306836996156>';
        const idTildeNaranja = '1523026579662307378'; // ID extraído para msg.react()

        const esRP = tipo === 'rp';
        const titulo = esRP 
            ? '<a:mari:1523027011524624457> **Southwest Florida** - *__Roleplay Sesión Inicio__* <a:mari:1523027011524624457>'
            : '<a:mari:1523027011524624457> Southwest Florida - __*Car Meet Sesión Inicio*__ <a:mari:1523027011524624457>';

        const descExtra = esRP
            ? `> <:felc:1523041359441952970> Registra tus vehículos en <#1505615426305130657>!\n\n`
            : `> <:felc:1523041359441952970> Recuerda evitar colisiones con vehículos y mantener el realismo!\n\n`;

        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(
                `> ${ePunto} <@${interaction.user.id}> ¡está organizando una **sesión de ${esRP ? 'roleplay' : 'car meet oficial'}**! Si tienes la intención de **unirte**, reacciona abajo con el emoji elegido por el host. ¡Si reaccionas sin unirte, podrías enfrentar __**consecuencias**__ por parte del equipo de staff!\n\n` +
                `**Antes de Unirte**\n\n` +
                `> <:felc:1523041359441952970> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
                `> <:felc:1523041359441952970> Lee la [información](https://discord.com/channels/1451939725308067842/1516590524725989437) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1525190667545088225)\n` +
                descExtra +
                `> <:felc:1523028004983406787> El host debe obtener __**${reacciones}+**__ reacciones antes de comenzar.`
            )
            .setColor('#74d4fc');

        if (urlImagen) embed.setImage(urlImagen);

        await interaction.reply({ content: `Lanzando Startup de ${esRP ? 'Roleplay' : 'Car Meet'}...`, ephemeral: true });
        const msg = await interaction.channel.send({ content: '@everyone', embeds: [embed] });
        
        try {
            await msg.react(idTildeNaranja);
        } catch (e) {
            console.error('Error al agregar reacción inicial:', e);
        }

        global.coleccionStartups.set(msg.id, { hostId: interaction.user.id, reaccionesRequeridas: reacciones, tipo, imagen: urlImagen });

        // 💾 GUARDAR EN MONGODB Y HISTORIAL
        try {
            await Sesion.create({
                idInicio: msg.id,
                hostId: interaction.user.id,
                tipo,
                reaccionesRequeridas: reacciones,
                imagen: urlImagen,
                estado: 'esperando_reacciones',
                guildId: interaction.guildId
            });

            await Historial.create({
                evento: 'STARTUP_INICIADO',
                mensajeId: msg.id,
                hostId: interaction.user.id,
                hostTag: interaction.user.tag,
                tipo,
                detalles: { reaccionesRequeridas: reacciones, imagen: urlImagen },
                guildId: interaction.guildId
            });
        } catch (error) {
            console.error('Error al guardar Startup en MongoDB:', error);
        }
    }
};
