import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';
import { puedeUsarSesiones } from '../../utils/gestorSesionesRestricciones.js';
import { bloquearSiCooldown, setCooldownSesion } from '../../utils/cooldownSesiones.js';
import { iniciarLogSesion } from '../../utils/logSesionArchivo.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';

const IMAGEN_INICIO_RP =
    'https://cdn.discordapp.com/attachments/1505017301089652898/1548119322105479209/Inicio_roleplay_1.png?ex=6aa5e5f9&is=6aa49479&hm=4289dc7a03339ff070272a1edff97cda6932bb4ada18b74c899e8aa9c0e45373&';
const IMAGEN_INICIO_MEET =
    'https://cdn.discordapp.com/attachments/1505017301089652898/1548119321752895508/Inicio_Carmeet_1.png?ex=6aa5e5f8&is=6aa49478&hm=7a35a93f01e0f3c438abebe945fe4caa9dac31b8c1008391ce1ef1ef4bca55b8&';

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

        const idTildeNaranja = EMOJI_DEF.tilde.id;

        const esRP = tipo === 'rp';
        const titulo = esRP
            ? E.a2alas + ' Southwest Florida Comunidad 00Y4n — __*Inicio de Roleplay*__ ' + E.a2alas
            : E.a2alas + ' Southwest Florida Comunidad 00Y4n — __*Inicio de Car Meet*__ ' + E.a2alas;

        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(
                E.dot + ` <@${interaction.user.id}> **está hosteando una sesión de ${esRP ? 'Roleplay' : 'Car Meet'}!** Antes de unirte, asegurate de que la privacidad de tu cuenta esté en **'Everyone'**. Al unirte, confirmás que leíste todas las regulaciones del servidor. Cuando la sesión se libere, el host enviará otro mensaje con una notificación.\n\n` +
                    E.flecha + ` Por favor sé paciente mientras el staff configura todo. Hay numerosos factores en la preparación de una sesión para garantizar la máxima calidad de roleplay.\n\n` +
                    E.replican + ` Para que el host comience a configurar y la sesión inicie, necesitamos __**${reacciones}+**__ reacciones. Una vez alcanzada la meta, se liberará el acceso anticipado.`
            )
            .setColor('#74d4fc');

        embed.setImage(esRP ? IMAGEN_INICIO_RP : IMAGEN_INICIO_MEET);

        await interaction.reply({ content: `Lanzando Startup de ${esRP ? 'Roleplay' : 'Car Meet'}...`, ephemeral: true });
        const msg = await interaction.channel.send({ content: '@everyone', embeds: [embed] });

        try {
            await msg.react(idTildeNaranja);
        } catch (e) {
            console.error('Error al agregar reacción inicial:', e);
        }

        try {
            const imagenGuardada = esRP ? IMAGEN_INICIO_RP : IMAGEN_INICIO_MEET;
            const sesionData = await Sesion.create({
                idInicio: msg.id,
                hostId: interaction.user.id,
                tipo,
                reaccionesRequeridas: reacciones,
                imagen: imagenGuardada,
                estado: 'esperando_reacciones',
                guildId: interaction.guildId,
                reacciones: []
            });

            global.coleccionStartups.set(msg.id, {
                hostId: interaction.user.id,
                reaccionesRequeridas: reacciones,
                tipo,
                imagen: imagenGuardada,
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
                detalles: { reaccionesRequeridas: reacciones, imagen: imagenGuardada },
                guildId: interaction.guildId
            });
        } catch (error) {
            console.error('Error al guardar Startup en MongoDB:', error);
        }
    }
};
