import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import {
  discordToRoblox,
  obtenerUsuarioRoblox,
  tieneApiKeyBloxlink
} from '../../utils/gestorBloxlink.js';
import { PRIMARIO, COLORES } from '../../utils/colores.js';
import { logger } from '../../utils/logger.js';

/** Rol Ciudadano (verificado) */
const ROL_CIUDADANO_ID = '1506800624493269057';
/** Nombre del rol de no verificado (Bloxlink / servidor) */
const NOMBRE_ROL_NO_VERIFICADO = 'No Verificado';

export default {
  name: 'verificar_bloxlink_swfl',

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!tieneApiKeyBloxlink()) {
      return interaction.editReply({
        content:
          '❌ La verificación no está configurada (`BLOXLINK_API_KEY` faltante). Avisá a Alto Comando.'
      });
    }

    if (!interaction.guild || !interaction.member) {
      return interaction.editReply({ content: '❌ Este botón solo funciona dentro del servidor.' });
    }

    const guild = interaction.guild;
    const member = interaction.member;

    // Ya tiene Ciudadano
    if (member.roles.cache.has(ROL_CIUDADANO_ID)) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORES.exito)
            .setTitle('Ya estás verificado')
            .setDescription(
              `Ya tenés el rol de **Ciudadano**.\nSi cambiaste de cuenta de Roblox, actualizá en [blox.link](https://blox.link) y volvé a apretar el botón.`
            )
        ]
      });
    }

    const lookup = await discordToRoblox(guild.id, interaction.user.id);

    if (!lookup.ok) {
      if (lookup.reason === 'not_linked') {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORES.advertencia)
              .setTitle('Vinculá tu cuenta de Roblox')
              .setDescription(
                [
                  `Bloxlink **no tiene** una cuenta de Roblox vinculada a vos en **${guild.name}**.`,
                  '',
                  '**Cómo vincularte:**',
                  '1. Abrí [blox.link](https://blox.link) e iniciá sesión con Discord.',
                  '2. Andá a **Verification**, elegí **este servidor** y terminá la verificación (juego o perfil).',
                  '3. Volvé acá y apretá de nuevo **Verificar con Bloxlink**.',
                  '',
                  'También podés usar `/verify` de Bloxlink si el bot está en el servidor.'
                ].join('\n')
              )
          ]
        });
      }

      if (lookup.reason === 'rate_limited') {
        return interaction.editReply({
          content: '⏳ Bloxlink está limitando peticiones. Esperá un minuto y reintentá.'
        });
      }

      if (lookup.reason === 'missing_api_key') {
        return interaction.editReply({
          content: '❌ Falta `BLOXLINK_API_KEY` en el entorno. Avisá a Alto Comando.'
        });
      }

      return interaction.editReply({
        content:
          '❌ No se pudo consultar Bloxlink ahora. Reintentá en unos segundos. Si sigue fallando, abrí ticket.'
      });
    }

    const roblox = await obtenerUsuarioRoblox(lookup.robloxId);
    const smartName = roblox?.smartName || roblox?.name || lookup.robloxId;
    const robloxName = roblox?.name || lookup.robloxId;

    // Roles
    const rolCiudadano = guild.roles.cache.get(ROL_CIUDADANO_ID);
    if (!rolCiudadano) {
      logger.error(`[bloxlink-verify] Rol Ciudadano ${ROL_CIUDADANO_ID} no encontrado`);
      return interaction.editReply({
        content: '❌ El rol de Ciudadano no existe en este servidor. Avisá a Alto Comando.'
      });
    }

    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply({
        content: '❌ No tengo permiso **Manage Roles** para darte el rol. Avisá a Alto Comando.'
      });
    }
    if (rolCiudadano.position >= me.roles.highest.position) {
      return interaction.editReply({
        content:
          '❌ El rol Ciudadano está por encima del mío. Un admin debe subir el rol del bot en la lista de roles.'
      });
    }

    try {
      await member.roles.add(rolCiudadano, 'Verificación Bloxlink (00Y4n)');
    } catch (err) {
      logger.error('[bloxlink-verify] No se pudo agregar rol:', err?.message || err);
      return interaction.editReply({
        content: '❌ No pude asignarte el rol Ciudadano. Revisá la jerarquía de roles del bot.'
      });
    }

    // Quitar "No Verificado" si existe
    try {
      const rolNoVerificado = guild.roles.cache.find(
        (r) => r.name.toLowerCase() === NOMBRE_ROL_NO_VERIFICADO.toLowerCase()
      );
      if (rolNoVerificado && member.roles.cache.has(rolNoVerificado.id)) {
        if (rolNoVerificado.position < me.roles.highest.position) {
          await member.roles.remove(rolNoVerificado, 'Verificación Bloxlink (00Y4n)').catch(() => null);
        }
      }
    } catch (_) {}

    // Nickname estilo {smart-name} (como Bloxlink)
    try {
      if (me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
        const nick = String(smartName).slice(0, 32);
        if (member.manageable && member.displayName !== nick) {
          await member.setNickname(nick, 'Verificación Bloxlink \u00b7 smart-name').catch(() => null);
        }
      }
    } catch (_) {}

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORES.exito)
          .setTitle('¡Verificación completada!')
          .setDescription(
            [
              `Bienvenido a **${guild.name}**, **${smartName}**.`,
              '',
              `• **Roblox:** [${robloxName}](https://www.roblox.com/users/${lookup.robloxId}/profile)`,
              `• **Rol:** Ciudadano`,
              '',
              'Ya podés navegar el resto del servidor. ¡Disfrutá el roleplay!'
            ].join('\n')
          )
          .setFooter({ text: '00Y4n \u00b7 Bloxlink' })
          .setTimestamp()
      ]
    });
  }
};
