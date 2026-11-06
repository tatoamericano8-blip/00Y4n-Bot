/**
 * Footer de marca en embeds del bot.
 * - 1 embed en el mensaje → footer en ese embed
 * - 2+ embeds en el mismo mensaje/respuesta → footer SOLO en el último
 * No toca customIds, labels, emojis ni lógica de comandos.
 */
import {
  EmbedBuilder,
  TextChannel,
  DMChannel,
  NewsChannel,
  ThreadChannel,
  Message,
  MessagePayload,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  ModalSubmitInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction
} from 'discord.js';

export const BRAND_FOOTER_TEXT = 'Southwest Florida Comunidad 00Y4n ™';

let aplicado = false;

/**
 * Normaliza un array de embeds: quita footer de todos excepto el último.
 * @param {any[]} embeds
 */
export function aplicarFooterSoloUltimo(embeds) {
  if (!Array.isArray(embeds) || embeds.length === 0) return embeds;
  const n = embeds.length;
  return embeds.map((emb, i) => {
    let data;
    try {
      if (emb && typeof emb.toJSON === 'function') {
        data = emb.toJSON();
      } else if (emb && typeof emb === 'object') {
        data = { ...emb };
      } else {
        return emb;
      }
    } catch {
      return emb;
    }
    if (!data || typeof data !== 'object') return emb;
    data = { ...data };
    if (n > 1 && i < n - 1) {
      delete data.footer;
    } else {
      data.footer = { text: BRAND_FOOTER_TEXT };
    }
    return data;
  });
}

function wrapPayload(options) {
  if (!options || typeof options !== 'object') return options;
  if (!Array.isArray(options.embeds) || options.embeds.length === 0) return options;
  return { ...options, embeds: aplicarFooterSoloUltimo(options.embeds) };
}

function patchMethod(proto, key) {
  if (!proto || typeof proto[key] !== 'function') return;
  const orig = proto[key];
  if (orig.__00y4nFooterPatch) return;
  function patched(options, ...args) {
    return orig.call(this, wrapPayload(options), ...args);
  }
  patched.__00y4nFooterPatch = true;
  try {
    Object.defineProperty(proto, key, {
      value: patched,
      writable: true,
      configurable: true
    });
  } catch {
    proto[key] = patched;
  }
}

export function aplicarParcheFooterEmbed() {
  if (aplicado) return;
  aplicado = true;

  const originalSetFooter = EmbedBuilder.prototype.setFooter;

  EmbedBuilder.prototype.setFooter = function setFooterParcheado(_footerData) {
    return originalSetFooter.call(this, { text: BRAND_FOOTER_TEXT });
  };

  // NO parchear toJSON: forzaba footer en CADA embed y duplicaba la marca
  // cuando había banner + contenido.

  // MessagePayload: casi todos los envíos pasan por acá
  if (MessagePayload?.prototype) {
    const origResolve = MessagePayload.prototype.resolve;
    if (typeof origResolve === 'function' && !origResolve.__00y4nFooterPatch) {
      function resolvePatched(...args) {
        try {
          if (this.options && Array.isArray(this.options.embeds) && this.options.embeds.length) {
            this.options = wrapPayload(this.options);
          }
        } catch {
          /* no romper el envío */
        }
        return origResolve.apply(this, args);
      }
      resolvePatched.__00y4nFooterPatch = true;
      MessagePayload.prototype.resolve = resolvePatched;
    }
  }

  for (const Cls of [TextChannel, DMChannel, NewsChannel, ThreadChannel]) {
    if (Cls?.prototype) patchMethod(Cls.prototype, 'send');
  }
  if (Message?.prototype) {
    patchMethod(Message.prototype, 'edit');
  }

  const interactionClasses = [
    ChatInputCommandInteraction,
    ButtonInteraction,
    StringSelectMenuInteraction,
    UserSelectMenuInteraction,
    RoleSelectMenuInteraction,
    ChannelSelectMenuInteraction,
    MentionableSelectMenuInteraction,
    ModalSubmitInteraction,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction
  ];
  for (const Cls of interactionClasses) {
    if (!Cls?.prototype) continue;
    for (const key of ['reply', 'editReply', 'followUp', 'update']) {
      patchMethod(Cls.prototype, key);
    }
  }
}

aplicarParcheFooterEmbed();

export default aplicarParcheFooterEmbed;
