import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType
} from 'discord.js';
import {
  obtenerSaldo,
  restarSaldoExacto,
  agregarSaldo
} from '../../utils/gestorEconomia.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

const MIN_APUESTA = 100;
const MAX_APUESTA = 35000;
const COOLDOWN_MS = 90 * 1000; // 1 minuto y medio
const PARTIDA_TIMEOUT_MS = 90 * 1000;

const cooldowns = new Map();

const PALOS = ['♠', '♥', '♦', '♣'];
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function crearMazo() {
  const mazo = [];
  for (const palo of PALOS) {
    for (const valor of VALORES) {
      mazo.push({ valor, palo });
    }
  }
  for (let i = mazo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
  }
  return mazo;
}

function valorCarta(carta) {
  if (carta.valor === 'A') return 11;
  if (['J', 'Q', 'K'].includes(carta.valor)) return 10;
  return Number(carta.valor);
}

function valorMano(mano) {
  let total = 0;
  let ases = 0;
  for (const c of mano) {
    total += valorCarta(c);
    if (c.valor === 'A') ases++;
  }
  while (total > 21 && ases > 0) {
    total -= 10;
    ases--;
  }
  return total;
}

function esBlackjack(mano) {
  return mano.length === 2 && valorMano(mano) === 21;
}

function formatearMano(mano, ocultarSegunda = false) {
  if (ocultarSegunda && mano.length >= 2) {
    return `${mano[0].valor}${mano[0].palo} · 🂠`;
  }
  return mano.map((c) => `${c.valor}${c.palo}`).join(' · ');
}

function parseApuesta(raw, saldo) {
  const t = String(raw || '').trim().toLowerCase();
  if (t === 'all' || t === 'todo' || t === 'max') {
    return Math.min(saldo, MAX_APUESTA);
  }
  const n = Number(String(t).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function botonesJuego(partidaId, { puedeDoblar }) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bj:${partidaId}:hit`)
      .setLabel('Pedir')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`bj:${partidaId}:stand`)
      .setLabel('Plantarse')
      .setStyle(ButtonStyle.Secondary)
  );
  if (puedeDoblar) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`bj:${partidaId}:double`)
        .setLabel('Doblar')
        .setStyle(ButtonStyle.Success)
    );
  }
  return row;
}

function botonesDeshabilitados(partidaId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bj:${partidaId}:hit`)
      .setLabel('Pedir')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`bj:${partidaId}:stand`)
      .setLabel('Plantarse')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );
}

function embedPartida({ user, apuesta, jugador, dealer, ocultarDealer, estadoTxt, saldo, color }) {
  const vJ = valorMano(jugador);
  const vD = ocultarDealer ? valorCarta(dealer[0]) : valorMano(dealer);
  const titulo = `${E.blackjack || '🃏'} Blackjack`;

  return new EmbedBuilder()
    .setColor(color || PRIMARIO)
    .setTitle(titulo)
    .setDescription(
      `**Jugador:** <@${user.id}>\n` +
        `**Apuesta:** $${apuesta.toLocaleString('es-AR')}\n\n` +
        `**Tu mano** (${vJ}): ${formatearMano(jugador)}\n` +
        `**Dealer** (${ocultarDealer ? vD + '+' : vD}): ${formatearMano(dealer, ocultarDealer)}\n\n` +
        (estadoTxt || '') +
        (saldo != null ? `\n**Saldo:** $${Number(saldo).toLocaleString('es-AR')}` : '')
    )
    .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™ · Blackjack' })
    .setTimestamp();
}

async function resolverDealerYPago(estado) {
  const { mazo, jugador, dealer, apuesta, userId, naturalJugador } = estado;

  // Si el jugador ya se pasó, no juega el dealer
  if (valorMano(jugador) <= 21) {
    while (valorMano(dealer) < 17) {
      dealer.push(mazo.pop());
    }
  }

  const vJ = valorMano(jugador);
  const vD = valorMano(dealer);
  let resultado = 'lose';
  let gananciaNeta = -apuesta;
  let mensaje = '';

  if (vJ > 21) {
    resultado = 'bust';
    mensaje = `${E.cruz || '❌'} **Te pasaste.** Perdiste **$${apuesta.toLocaleString('es-AR')}**.`;
    gananciaNeta = -apuesta;
  } else if (naturalJugador && !esBlackjack(dealer)) {
    // Blackjack natural paga 3:2 → neto +1.5x (se devuelve apuesta + 1.5)
    const premio = Math.floor(apuesta * 2.5); // total acreditado
    await agregarSaldo(userId, premio, {
      tipo: 'INGRESO',
      motivo: `Blackjack natural (+3:2) apuesta $${apuesta}`
    });
    gananciaNeta = premio - apuesta;
    resultado = 'blackjack';
    mensaje = `${E.corona || '👑'} **Blackjack natural!** Ganaste **$${gananciaNeta.toLocaleString('es-AR')}** (3:2).`;
  } else if (vD > 21) {
    const premio = apuesta * 2;
    await agregarSaldo(userId, premio, {
      tipo: 'INGRESO',
      motivo: `Blackjack ganó (dealer bust) apuesta $${apuesta}`
    });
    gananciaNeta = apuesta;
    resultado = 'win';
    mensaje = `${E.tilde || '✅'} **Dealer se pasó.** Ganaste **$${apuesta.toLocaleString('es-AR')}**.`;
  } else if (vJ > vD) {
    const premio = apuesta * 2;
    await agregarSaldo(userId, premio, {
      tipo: 'INGRESO',
      motivo: `Blackjack ganó apuesta $${apuesta}`
    });
    gananciaNeta = apuesta;
    resultado = 'win';
    mensaje = `${E.tilde || '✅'} **Ganaste.** +**$${apuesta.toLocaleString('es-AR')}**.`;
  } else if (vJ === vD) {
    await agregarSaldo(userId, apuesta, {
      tipo: 'INGRESO',
      motivo: `Blackjack empate (push) apuesta $${apuesta}`
    });
    gananciaNeta = 0;
    resultado = 'push';
    mensaje = `${E.dot || '•'} **Empate.** Se devuelve tu apuesta de **$${apuesta.toLocaleString('es-AR')}**.`;
  } else {
    resultado = 'lose';
    mensaje = `${E.cruz || '❌'} **Perdiste.** -**$${apuesta.toLocaleString('es-AR')}**.`;
    gananciaNeta = -apuesta;
  }

  const saldo = await obtenerSaldo(userId);
  return { resultado, mensaje, gananciaNeta, saldo, vJ, vD };
}

export default {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Jugá blackjack apostando tu saldo.')
    .addStringOption((o) =>
      o
        .setName('apuesta')
        .setDescription(`Monto (mín ${MIN_APUESTA}, máx ${MAX_APUESTA}) o "all"`)
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const ahora = Date.now();
    const cd = cooldowns.get(userId);
    if (cd && ahora < cd) {
      const seg = Math.ceil((cd - ahora) / 1000);
      return interaction.reply({
        content: `${E.tiempo || '⏳'} Cooldown: podés volver a jugar en **${seg}s**.`,
        flags: MessageFlags.Ephemeral
      });
    }

    const saldo = await obtenerSaldo(userId);
    const apuesta = parseApuesta(interaction.options.getString('apuesta'), saldo);

    if (apuesta == null) {
      return interaction.reply({
        content: `${E.cruz || '❌'} Apuesta inválida. Usá un número o \`all\`.`,
        flags: MessageFlags.Ephemeral
      });
    }
    if (apuesta < MIN_APUESTA) {
      return interaction.reply({
        content: `${E.cruz || '❌'} La apuesta mínima es **$${MIN_APUESTA.toLocaleString('es-AR')}**.`,
        flags: MessageFlags.Ephemeral
      });
    }
    if (apuesta > MAX_APUESTA) {
      return interaction.reply({
        content: `${E.cruz || '❌'} La apuesta máxima es **$${MAX_APUESTA.toLocaleString('es-AR')}**.`,
        flags: MessageFlags.Ephemeral
      });
    }
    if (saldo < apuesta) {
      return interaction.reply({
        content: `${E.cruz || '❌'} Saldo insuficiente. Tenés **$${saldo.toLocaleString('es-AR')}**.`,
        flags: MessageFlags.Ephemeral
      });
    }

    const cobro = await restarSaldoExacto(userId, apuesta, {
      tipo: 'EGRESO',
      motivo: `Blackjack apuesta $${apuesta}`
    });
    if (!cobro.ok) {
      return interaction.reply({
        content: `${E.cruz || '❌'} No se pudo descontar la apuesta. Saldo: **$${cobro.saldo.toLocaleString('es-AR')}**.`,
        flags: MessageFlags.Ephemeral
      });
    }

    const mazo = crearMazo();
    const jugador = [mazo.pop(), mazo.pop()];
    const dealer = [mazo.pop(), mazo.pop()];
    const naturalJugador = esBlackjack(jugador);
    const naturalDealer = esBlackjack(dealer);

    const partidaId = `${userId}_${Date.now().toString(36)}`;
    const estado = {
      userId,
      apuesta,
      mazo,
      jugador,
      dealer,
      naturalJugador,
      terminada: false
    };

    // Blackjack natural inmediato
    if (naturalJugador || naturalDealer) {
      cooldowns.set(userId, Date.now() + COOLDOWN_MS);
      const res = await resolverDealerYPago(estado);
      const color =
        res.resultado === 'win' || res.resultado === 'blackjack'
          ? '#57F287'
          : res.resultado === 'push'
            ? PRIMARIO
            : '#ED4245';
      const embed = embedPartida({
        user: interaction.user,
        apuesta,
        jugador,
        dealer,
        ocultarDealer: false,
        estadoTxt: res.mensaje,
        saldo: res.saldo,
        color
      });
      return interaction.reply({ embeds: [embed] });
    }

    const embed = embedPartida({
      user: interaction.user,
      apuesta,
      jugador,
      dealer,
      ocultarDealer: true,
      estadoTxt: `${E.dot || '•'} Elegí una acción.`,
      saldo: cobro.saldo,
      color: PRIMARIO
    });

    const msg = await interaction.reply({
      embeds: [embed],
      components: [botonesJuego(partidaId, { puedeDoblar: true })],
      fetchReply: true
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: PARTIDA_TIMEOUT_MS,
      filter: (i) => i.customId.startsWith(`bj:${partidaId}:`)
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== userId) {
        return i.reply({
          content: `${E.cruz || '❌'} Esta partida no es tuya.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (estado.terminada) {
        return i.deferUpdate().catch(() => null);
      }

      const accion = i.customId.split(':')[2];

      try {
        if (accion === 'hit') {
          estado.jugador.push(estado.mazo.pop());
          if (valorMano(estado.jugador) > 21) {
            estado.terminada = true;
            collector.stop('bust');
            cooldowns.set(userId, Date.now() + COOLDOWN_MS);
            const res = await resolverDealerYPago(estado);
            await i.update({
              embeds: [
                embedPartida({
                  user: interaction.user,
                  apuesta: estado.apuesta,
                  jugador: estado.jugador,
                  dealer: estado.dealer,
                  ocultarDealer: false,
                  estadoTxt: res.mensaje,
                  saldo: res.saldo,
                  color: '#ED4245'
                })
              ],
              components: [botonesDeshabilitados(partidaId)]
            });
            return;
          }
          await i.update({
            embeds: [
              embedPartida({
                user: interaction.user,
                apuesta: estado.apuesta,
                jugador: estado.jugador,
                dealer: estado.dealer,
                ocultarDealer: true,
                estadoTxt: `${E.dot || '•'} Carta pedida. ¿Otra o te plantás?`,
                saldo: await obtenerSaldo(userId),
                color: PRIMARIO
              })
            ],
            components: [botonesJuego(partidaId, { puedeDoblar: false })]
          });
          return;
        }

        if (accion === 'double') {
          // Solo si aún tiene 2 cartas y saldo alcanza
          if (estado.jugador.length !== 2) {
            return i.reply({
              content: `${E.cruz || '❌'} Solo podés doblar con las dos cartas iniciales.`,
              flags: MessageFlags.Ephemeral
            });
          }
          const extra = await restarSaldoExacto(userId, estado.apuesta, {
            tipo: 'EGRESO',
            motivo: `Blackjack double down +$${estado.apuesta}`
          });
          if (!extra.ok) {
            return i.reply({
              content: `${E.cruz || '❌'} No tenés saldo para doblar. Saldo: **$${extra.saldo.toLocaleString('es-AR')}**.`,
              flags: MessageFlags.Ephemeral
            });
          }
          estado.apuesta *= 2;
          estado.jugador.push(estado.mazo.pop());
          estado.terminada = true;
          collector.stop('double');
          cooldowns.set(userId, Date.now() + COOLDOWN_MS);
          const res = await resolverDealerYPago(estado);
          const color =
            res.resultado === 'win' || res.resultado === 'blackjack'
              ? '#57F287'
              : res.resultado === 'push'
                ? PRIMARIO
                : '#ED4245';
          await i.update({
            embeds: [
              embedPartida({
                user: interaction.user,
                apuesta: estado.apuesta,
                jugador: estado.jugador,
                dealer: estado.dealer,
                ocultarDealer: false,
                estadoTxt: `${E.money || ''} **Doblaste.**\n${res.mensaje}`,
                saldo: res.saldo,
                color
              })
            ],
            components: [botonesDeshabilitados(partidaId)]
          });
          return;
        }

        if (accion === 'stand') {
          estado.terminada = true;
          collector.stop('stand');
          cooldowns.set(userId, Date.now() + COOLDOWN_MS);
          const res = await resolverDealerYPago(estado);
          const color =
            res.resultado === 'win' || res.resultado === 'blackjack'
              ? '#57F287'
              : res.resultado === 'push'
                ? PRIMARIO
                : '#ED4245';
          await i.update({
            embeds: [
              embedPartida({
                user: interaction.user,
                apuesta: estado.apuesta,
                jugador: estado.jugador,
                dealer: estado.dealer,
                ocultarDealer: false,
                estadoTxt: res.mensaje,
                saldo: res.saldo,
                color
              })
            ],
            components: [botonesDeshabilitados(partidaId)]
          });
        }
      } catch (e) {
        console.error('[blackjack]', e);
        await i.reply({
          content: `${E.cruz || '❌'} Error en la partida. Si se descontó saldo, contactá staff.`,
          flags: MessageFlags.Ephemeral
        }).catch(() => null);
      }
    });

    collector.on('end', async (_, reason) => {
      if (estado.terminada) return;
      if (reason === 'time') {
        estado.terminada = true;
        cooldowns.set(userId, Date.now() + COOLDOWN_MS);
        try {
          const res = await resolverDealerYPago(estado);
          await msg.edit({
            embeds: [
              embedPartida({
                user: interaction.user,
                apuesta: estado.apuesta,
                jugador: estado.jugador,
                dealer: estado.dealer,
                ocultarDealer: false,
                estadoTxt: `${E.tiempo || '⏳'} Tiempo agotado — te plantaste automático.\n${res.mensaje}`,
                saldo: res.saldo,
                color: PRIMARIO
              })
            ],
            components: [botonesDeshabilitados(partidaId)]
          });
        } catch (e) {
          console.error('[blackjack] timeout:', e);
        }
      }
    });
  }
};
