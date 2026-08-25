import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';
import { puedeUsarSesiones } from '../../utils/gestorSesionesRestricciones.js';
import { bloquearSiCooldown, setCooldownSesion } from '../../utils/cooldownSesiones.js';
import { iniciarLogSesion } from '../../utils/logSesionArchivo.js';

global.coleccionStartups = global.coleccionStartups || new Map();

export default {
    data: {
        name: 'inicio',
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

        const check = await puedeUsarSesiones(interaction.guildId, interaction.user.id);
        if (!check.ok) {
            if (check.razon === 'blacklist') {
                return interaction.reply({
                    content: 'Estás en la blacklist permanente de sesiones. No puedes iniciar ni participar.',
                    ephemeral: true
                });
            }
            const hasta = check.hasta ? `<t:${Math.floor(new Date(check.hasta).getTime() / 1000)}:R>` : 'pronto';
            return interaction.reply({
                content: `Estás suspendido de sesiones hasta ${hasta}. Motivo: ${check.motivo || '-'}`,
                ephemeral: true
            });
        }

        if (await bloquearSiCooldown(interaction, 'inicio_swfl')) return;
        setCooldownSesion(interaction.guildId, 'inicio_swfl', interaction.member);

        const tipo = interaction.options.getString('tipo');
        const reacciones = interaction.options.getInteger('reacciones');
        const urlImagen = interaction.options.getString('imagen');

        const ePunto = '<a:felc:1534939368035324125>';
        const idTildeNaranja = '1534937809733812286';

        const esRP = tipo === 'rp';
        const titulo = esRP
            ? '<a:mari:1534954231138746488> Southwest Florida - *__Roleplay Sesión Inicio__* <a:mari:1534954231138746488>'
            : '<a:mari:1534954231138746488> Southwest Florida - __*Car Meet Sesión Inicio*__ <a:mari:1534954231138746488>';

        const descExtra = esRP
            ? ` <:dot:1534938142665084938> Registra tus vehículos en <#1505615426305130657>!\n\n`
            : ` <:dot:1534938142665084938> Recuerda evitar colisiones con vehículos y mantener el realismo!\n\n`;

        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(
                `> ${ePunto} <@${interaction.user.id}> está organizando una **sesión de ${esRP ? 'roleplay' : 'car meet oficial'}**! Antes de unirte, asegúrate de que la configuración de privacidad de tu cuenta esté en **Everyone**. Al unirte, confirmas que leíste las normas del servidor.\n\n` +
                    `**Antes de Unirte**\n\n` +
                    ` <:dot:1534938142665084938> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
                    ` <:dot:1534938142665084938> Lee la [información](https://discord.com/channels/1451939725308067842/1451942179877687399/1536059852432867412) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1536064730223874132).\n` +
                    descExtra +
                    ` <:replica:1534982812116062370> El host debe obtener __**${reacciones}+**__ reacciones antes de comenzar.`
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

        try {
            const sesionData = await Sesion.create({
                idInicio: msg.id,
                hostId: interaction.user.id,
                tipo,
                reaccionesRequeridas: reacciones,
                imagen: urlImagen,
                estado: 'esperando_reacciones',
                guildId: interaction.guildId,
                reacciones: []
            });

            global.coleccionStartups.set(msg.id, {
                hostId: interaction.user.id,
                reaccionesRequeridas: reacciones,
                tipo,
                imagen: urlImagen,
                sesionId: sesionData._id
            });

            iniciarLogSesion({
                guildId: interaction.guildId,
                idInicio: msg.id,
                hostId: interaction.user.id,
                tipo,
                fechaInicio: new Date()
            });

            await Historial.create({
                evento: 'STARTUP_INICIADO',
                idInicio: msg.id,
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
