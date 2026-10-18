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
const MAX_APUESTA = 100_000;
const COOLDOWN_MS = 10 * 1000;
const PARTIDA_IDLE_MS = 90 * 1000;

const cooldowns = new Map();
/** userId → true mientras hay adivina-auto pendiente */
const partidasActivas = new Set();

const AUTOS = [
  { nombre: 'Honda Civic Type R', anioMin: 2017, anioMax: 2022, pistas: ['Sedán/hatch compacto', 'Variante deportiva Type R', 'Eficiente en combustible'], opciones: ['Ford F-150', 'Honda Civic', 'Toyota Camry', 'Chevrolet Silverado'], correcta: 1 },
  { nombre: 'Volkswagen Golf GTI', anioMin: 2015, anioMax: 2023, pistas: ['Hatchback europeo', 'Variante GTI deportiva', 'Tracción delantera'], opciones: ['Volkswagen Golf', 'BMW X5', 'Ram 1500', 'Mercedes-Benz S-Class'], correcta: 0 },
  { nombre: 'Toyota Corolla', anioMin: 2014, anioMax: 2024, pistas: ['Sedán compacto muy común', 'Fiable y económico', 'Ideal para ciudad'], opciones: ['Toyota Corolla', 'Lamborghini Huracán', 'Ford Mustang', 'Jeep Wrangler'], correcta: 0 },
  { nombre: 'Mazda3', anioMin: 2014, anioMax: 2023, pistas: ['Compacto japonés', 'Diseño elegante', 'Buena respuesta al volante'], opciones: ['Chevrolet Tahoe', 'Mazda3', 'GMC Sierra', 'Porsche 911'], correcta: 1 },
  { nombre: 'Hyundai Elantra N', anioMin: 2021, anioMax: 2025, pistas: ['Sedán compacto coreano', 'Versión N de alto rendimiento', 'Escape deportivo'], opciones: ['Hyundai Elantra', 'Honda Odyssey', 'Tesla Model Y', 'Dodge Charger'], correcta: 0 },
  { nombre: 'Toyota Camry', anioMin: 2018, anioMax: 2024, pistas: ['Sedán mediano familiar', 'Muy usado en EE.UU.', 'Opción híbrida disponible'], opciones: ['Toyota Camry', 'Ferrari 488', 'Can-Am Maverick', 'Ford Bronco'], correcta: 0 },
  { nombre: 'Honda Accord', anioMin: 2018, anioMax: 2024, pistas: ['Sedán mediano japonés', 'Espacioso y cómodo', 'Buena reventa'], opciones: ['Nissan GT-R', 'Honda Accord', 'Jeep Grand Cherokee', 'Chevrolet Corvette'], correcta: 1 },
  { nombre: 'BMW M3', anioMin: 2015, anioMax: 2024, pistas: ['Sedán deportivo alemán', 'Línea M de alto rendimiento', 'Tracción trasera o xDrive'], opciones: ['BMW M3', 'Toyota Prius', 'Honda CR-V', 'Ford Transit'], correcta: 0 },
  { nombre: 'Mercedes-Benz C63 AMG', anioMin: 2015, anioMax: 2023, pistas: ['Sedán de lujo alemán', 'Paquete AMG potente', 'Interior premium'], opciones: ['Kia Rio', 'Mercedes-Benz C-Class', 'Honda Civic', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Audi RS7', anioMin: 2014, anioMax: 2024, pistas: ['Fastback de lujo', 'RS de alto rendimiento', 'Quattro AWD'], opciones: ['Audi RS7', 'Toyota Yaris', 'Ford Fiesta', 'Chevrolet Spark'], correcta: 0 },
  { nombre: 'Dodge Charger Hellcat', anioMin: 2015, anioMax: 2023, pistas: ['Sedán americano muscular', 'Motor V8 sobrealimentado', 'Muchísima potencia'], opciones: ['Mini Cooper', 'Dodge Charger', 'Honda Fit', 'Toyota Prius'], correcta: 1 },
  { nombre: 'Ford Mustang GT', anioMin: 2015, anioMax: 2024, pistas: ['Muscle car icónico', 'V8 opcional', 'Tracción trasera'], opciones: ['Honda Odyssey', 'Ford Mustang', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 1 },
  { nombre: 'Chevrolet Camaro SS', anioMin: 2016, anioMax: 2024, pistas: ['Muscle car americano', 'Rival directo del Mustang', 'Líneas agresivas'], opciones: ['Chevrolet Camaro', 'Honda CR-V', 'Subaru Forester', 'Toyota RAV4'], correcta: 0 },
  { nombre: 'Chevrolet Corvette C8', anioMin: 2020, anioMax: 2025, pistas: ['Deportivo americano', 'Motor central (C8)', 'Alto rendimiento'], opciones: ['Honda Civic', 'Chevrolet Corvette', 'Toyota Corolla', 'Nissan Versa'], correcta: 1 },
  { nombre: 'Porsche 911 Carrera', anioMin: 2012, anioMax: 2024, pistas: ['Ícono alemán deportivo', 'Motor trasero', 'Manejo preciso'], opciones: ['Ford F-150', 'Porsche 911', 'Ram 2500', 'GMC Yukon'], correcta: 1 },
  { nombre: 'Nissan GT-R', anioMin: 2012, anioMax: 2023, pistas: ['Supercar japonés', 'AWD ATTESA', 'Apodo Godzilla'], opciones: ['Nissan GT-R', 'Honda Accord', 'Toyota Camry', 'Kia Forte'], correcta: 0 },
  { nombre: 'Subaru WRX STI', anioMin: 2015, anioMax: 2021, pistas: ['Sedán AWD deportivo', 'Turbo boxer', 'Cultura rally'], opciones: ['Subaru WRX', 'Mercedes Sprinter', 'Ford Expedition', 'Chevrolet Suburban'], correcta: 0 },
  { nombre: 'Toyota RAV4', anioMin: 2019, anioMax: 2025, pistas: ['SUV compacto bestseller', 'Opción híbrida', 'Uso familiar diario'], opciones: ['Lamborghini Urus', 'Toyota RAV4', 'Ferrari Purosangue', 'McLaren 720S'], correcta: 1 },
  { nombre: 'Honda CR-V', anioMin: 2017, anioMax: 2024, pistas: ['SUV compacto japonés', 'Muy práctico', 'Fiable'], opciones: ['Honda CR-V', 'Bugatti Chiron', 'Koenigsegg Jesko', 'Pagani Huayra'], correcta: 0 },
  { nombre: 'Jeep Wrangler', anioMin: 2018, anioMax: 2025, pistas: ['Off-road icónico', 'Techo y puertas desmontables', '4x4 serio'], opciones: ['Tesla Model 3', 'Jeep Wrangler', 'BMW 3 Series', 'Audi A4'], correcta: 1 },
  { nombre: 'Ford Bronco', anioMin: 2021, anioMax: 2025, pistas: ['SUV off-road revival', 'Competidor del Wrangler', 'Estilo boxy'], opciones: ['Ford Bronco', 'Honda Civic', 'Toyota Camry', 'Nissan Altima'], correcta: 0 },
  { nombre: 'Chevrolet Tahoe', anioMin: 2015, anioMax: 2024, pistas: ['SUV full-size', 'Mucho espacio', 'Común en familias y flotas'], opciones: ['Mazda MX-5', 'Chevrolet Tahoe', 'Porsche Boxster', 'Alfa Romeo Giulia'], correcta: 1 },
  { nombre: 'BMW X5 M', anioMin: 2015, anioMax: 2024, pistas: ['SUV de lujo alemán', 'Versión M potente', 'xDrive'], opciones: ['Honda Fit', 'BMW X5', 'Toyota Yaris', 'Nissan Leaf'], correcta: 1 },
  { nombre: 'Tesla Model Y', anioMin: 2020, anioMax: 2025, pistas: ['SUV eléctrico', 'Autopilot disponible', 'Sin motor de combustión'], opciones: ['Tesla Model Y', 'Ford Mustang GT', 'Dodge Challenger', 'Chevrolet Camaro'], correcta: 0 },
  { nombre: 'Ford F-150', anioMin: 2015, anioMax: 2025, pistas: ['Pickup más vendida de EE.UU.', 'Varias cabinas y motores', 'Trabajo y uso diario'], opciones: ['Honda Civic', 'Ford F-150', 'Mazda3', 'Volkswagen Golf'], correcta: 1 },
  { nombre: 'Chevrolet Silverado 1500', anioMin: 2014, anioMax: 2025, pistas: ['Pickup full-size', 'Rival del F-150', 'Muy común en obra'], opciones: ['Chevrolet Silverado', 'Toyota Prius', 'Honda Accord', 'Hyundai Elantra'], correcta: 0 },
  { nombre: 'Ram 1500', anioMin: 2019, anioMax: 2025, pistas: ['Pickup americana', 'Interior premium en versiones altas', 'Suspensión cómoda'], opciones: ['Mini Cooper', 'Ram 1500', 'Fiat 500', 'Smart Fortwo'], correcta: 1 },
  { nombre: 'Toyota Tacoma', anioMin: 2016, anioMax: 2024, pistas: ['Pickup mediana', 'Excelente off-road', 'Muy fiable'], opciones: ['Toyota Tacoma', 'Ferrari 812', 'Lamborghini Aventador', 'McLaren Senna'], correcta: 0 },
  { nombre: 'GMC Sierra Denali', anioMin: 2019, anioMax: 2025, pistas: ['Pickup de lujo', 'Acabado Denali', 'Misma base que Silverado'], opciones: ['Honda Civic Type R', 'GMC Sierra', 'Volkswagen Polo', 'Toyota Yaris'], correcta: 1 },
  { nombre: 'Lamborghini Huracán', anioMin: 2014, anioMax: 2023, pistas: ['Supercar italiano', 'Motor V10', 'Diseño agresivo'], opciones: ['Toyota Corolla', 'Lamborghini Huracán', 'Honda Civic', 'Ford Focus'], correcta: 1 },
  { nombre: 'Ferrari 488 GTB', anioMin: 2015, anioMax: 2019, pistas: ['Supercar italiano', 'Motor V8 biturbo central', 'Sonido característico'], opciones: ['Ferrari 488', 'Honda CR-V', 'Toyota RAV4', 'Nissan Rogue'], correcta: 0 },
  { nombre: 'McLaren 720S', anioMin: 2017, anioMax: 2023, pistas: ['Supercar británico', 'Puertas dihedral', 'Fibra de carbono'], opciones: ['Ford F-150', 'McLaren 720S', 'Chevrolet Silverado', 'Ram 1500'], correcta: 1 },
  { nombre: 'Bugatti Chiron', anioMin: 2016, anioMax: 2022, pistas: ['Hypercar extremo', 'W16 quad-turbo', 'Velocidad de récord'], opciones: ['Bugatti Chiron', 'Honda Civic', 'Toyota Camry', 'Mazda3'], correcta: 0 },
  { nombre: 'Tesla Model 3', anioMin: 2018, anioMax: 2025, pistas: ['Sedán eléctrico masivo', 'Pantalla central grande', 'Aceleración fuerte'], opciones: ['Dodge Charger', 'Tesla Model 3', 'Ford Mustang GT', 'Chevrolet Camaro'], correcta: 1 },
  { nombre: 'Porsche Taycan', anioMin: 2020, anioMax: 2025, pistas: ['Sedán eléctrico de lujo', 'Marca alemana deportiva', 'Carga rápida'], opciones: ['Honda Odyssey', 'Porsche Taycan', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 1 },
  { nombre: 'Ford Mustang Mach-E', anioMin: 2021, anioMax: 2025, pistas: ['SUV eléctrico', 'Nombre Mustang', 'Sin motor V8'], opciones: ['Ford Mustang Mach-E', 'Jeep Wrangler', 'Toyota Tacoma', 'Ram 1500'], correcta: 0 },
  { nombre: 'Chevrolet Corvette C7', anioMin: 2014, anioMax: 2019, pistas: ['Deportivo americano', 'Última gen. motor delantero', 'Stingray'], opciones: ['Honda Fit', 'Chevrolet Corvette', 'Toyota Yaris', 'Kia Rio'], correcta: 1 },
  { nombre: 'Dodge Challenger SRT', anioMin: 2015, anioMax: 2023, pistas: ['Muscle car coupe', 'Estilo retro', 'V8 potente'], opciones: ['Dodge Challenger', 'Honda Civic', 'Toyota Corolla', 'Nissan Sentra'], correcta: 0 },
  { nombre: 'Jaguar F-Type', anioMin: 2014, anioMax: 2024, pistas: ['Deportivo británico', 'Diseño elegante', 'Escape con carácter'], opciones: ['Honda CR-V', 'Jaguar F-Type', 'Toyota RAV4', 'Ford Escape'], correcta: 1 },
  { nombre: 'Alfa Romeo Giulia Quadrifoglio', anioMin: 2016, anioMax: 2024, pistas: ['Sedán italiano deportivo', 'Insignia Quadrifoglio', 'Manejo ágil'], opciones: ['Alfa Romeo Giulia', 'Ford F-250', 'Chevrolet Suburban', 'GMC Yukon'], correcta: 0 },
  { nombre: 'Lexus IS 500', anioMin: 2021, anioMax: 2025, pistas: ['Sedán de lujo japonés', 'V8 atmosférico', 'Marca Lexus'], opciones: ['Honda Civic', 'Lexus IS', 'Toyota Prius', 'Nissan Versa'], correcta: 1 },
  { nombre: 'Cadillac CT5-V Blackwing', anioMin: 2022, anioMax: 2025, pistas: ['Sedán performance americano', 'Versión Blackwing', 'V8 sobrealimentado'], opciones: ['Cadillac CT5', 'Honda Fit', 'Toyota Yaris', 'Mitsubishi Mirage'], correcta: 0 },
  { nombre: 'Genesis G70', anioMin: 2019, anioMax: 2025, pistas: ['Sedán de lujo coreano', 'Buena relación calidad-precio', 'Marca Genesis'], opciones: ['Ford Bronco', 'Genesis G70', 'Jeep Wrangler', 'Toyota Tacoma'], correcta: 1 },
  { nombre: 'Kia Stinger GT', anioMin: 2018, anioMax: 2023, pistas: ['Fastback coreano', 'Versión GT turbo', 'Estilo deportivo'], opciones: ['Kia Stinger', 'Honda Odyssey', 'Toyota Sienna', 'Chrysler Voyager'], correcta: 0 },
  { nombre: 'Infiniti Q50 Red Sport', anioMin: 2016, anioMax: 2024, pistas: ['Sedán japonés de lujo', 'Versión Red Sport', 'Biturbo'], opciones: ['Ram 1500', 'Infiniti Q50', 'Ford F-150', 'Chevrolet Silverado'], correcta: 1 },
  { nombre: 'Acura TLX Type S', anioMin: 2021, anioMax: 2025, pistas: ['Sedán deportivo de lujo', 'Línea Type S', 'Marca Acura (Honda)'], opciones: ['Acura TLX', 'Toyota Corolla', 'Honda Civic base', 'Nissan Versa'], correcta: 0 }
];

const SLOT_SIMBOLOS = ['🔔', '⭐', '🍋', '💎', '7️⃣', '🍒'];

function parseApuesta(raw, saldo) {
  const t = String(raw || '').trim().toLowerCase();
  if (t === 'all' || t === 'todo' || t === 'max') {
    return Math.min(Math.max(0, Math.floor(saldo)), MAX_APUESTA);
  }
  const n = Number(String(t).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function fmt$(n) {
  return `$${Number(n).toLocaleString('es-AR')}`;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickAuto() {
  const base = AUTOS[Math.floor(Math.random() * AUTOS.length)];
  const pares = base.opciones.map((txt, i) => ({ txt, ok: i === base.correcta }));
  shuffleInPlace(pares);
  const opciones = pares.map((p) => p.txt);
  const correcta = pares.findIndex((p) => p.ok);
  return {
    nombre: base.nombre,
    anioMin: base.anioMin,
    anioMax: base.anioMax,
    pistas: [...base.pistas],
    opciones,
    correcta
  };
}

function checkCooldown(userId) {
  const ahora = Date.now();
  const cd = cooldowns.get(userId);
  if (cd && ahora < cd) {
    return Math.ceil((cd - ahora) / 1000);
  }
  return 0;
}

function setCooldown(userId) {
  cooldowns.set(userId, Date.now() + COOLDOWN_MS);
}

function botonesAuto(partidaId) {
  const labels = ['A', 'B', 'C', 'D'];
  return new ActionRowBuilder().addComponents(
    ...labels.map((lab, i) =>
      new ButtonBuilder()
        .setCustomId(`juego_auto:${partidaId}:${i}`)
        .setLabel(lab)
        .setStyle(ButtonStyle.Secondary)
    )
  );
}

function botonesDeshabilitados() {
  const labels = ['A', 'B', 'C', 'D'];
  return new ActionRowBuilder().addComponents(
    ...labels.map((lab) =>
      new ButtonBuilder()
        .setCustomId(`juego_auto_done:${lab}`)
        .setLabel(lab)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    )
  );
}

function embedAdivina(auto, apuesta, user) {
  const letras = ['A', 'B', 'C', 'D'];
  const opcionesTxt = auto.opciones
    .map((o, i) => `**${letras[i]}** ${o}`)
    .join('   ');
  return new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(`${E.auto || '🚗'} Adivina el auto`)
    .setDescription(
      `**Rango de años:** ${auto.anioMin}–${auto.anioMax}\n\n` +
        `**Pistas:**\n${auto.pistas.map((p) => `${E.dot || '•'} ${p}`).join('\n')}\n\n` +
        `**Elegí el auto correcto:**\n${opcionesTxt}`
    )
    .addFields(
      { name: 'Apuesta', value: fmt$(apuesta), inline: true },
      { name: 'Jugador', value: `${user}`, inline: true }
    )
    .setFooter({ text: 'Si acertás recuperás la apuesta y ganás lo mismo · 90s para responder' })
    .setTimestamp();
}

function girarSlots() {
  return [
    SLOT_SIMBOLOS[Math.floor(Math.random() * SLOT_SIMBOLOS.length)],
    SLOT_SIMBOLOS[Math.floor(Math.random() * SLOT_SIMBOLOS.length)],
    SLOT_SIMBOLOS[Math.floor(Math.random() * SLOT_SIMBOLOS.length)]
  ];
}

function resultadoSlots(simbolos) {
  const [a, b, c] = simbolos;
  if (a === b && b === c) return { tipo: 'triple', multiplicador: 3 };
  if (a === b || b === c || a === c) return { tipo: 'doble', multiplicador: 1 };
  return { tipo: 'nada', multiplicador: 0 };
}

export default {
  data: new SlashCommandBuilder()
    .setName('juegos')
    .setDescription('Minijuegos con apuestas — elegí el juego en el menú.')
    .addStringOption((o) =>
      o
        .setName('juego')
        .setDescription('Qué juego querés jugar')
        .setRequired(true)
        .addChoices(
          { name: 'Adivina el auto', value: 'adivina-auto' },
          { name: 'Slots (tragamonedas)', value: 'slots' },
          { name: 'Cara o cruz', value: 'moneda' }
        )
    )
    .addStringOption((o) =>
      o
        .setName('cantidad')
        .setDescription(`Apuesta (mín ${MIN_APUESTA}, máx ${MAX_APUESTA}) o "all"`)
        .setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('eleccion')
        .setDescription('Solo para Cara o cruz: cara o cruz')
        .setRequired(false)
        .addChoices(
          { name: 'Cara', value: 'cara' },
          { name: 'Cruz', value: 'cruz' }
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getString('juego');
    const userId = interaction.user.id;

    const segCd = checkCooldown(userId);
    if (segCd > 0) {
      return interaction.reply({
        content: `${E.tiempo || '⏳'} Cooldown: podés jugar de nuevo en **${segCd}s**.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'adivina-auto') {
      if (partidasActivas.has(userId)) {
        return interaction.reply({
          content: `${E.lock || '🔒'} Ya tenés una partida de **Adivina el auto** pendiente. Terminála antes de empezar otra.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const saldo = await obtenerSaldo(userId);
      const apuesta = parseApuesta(interaction.options.getString('cantidad'), saldo);
      if (apuesta == null) {
        return interaction.reply({
          content: `${E.cruz || '❌'} Cantidad inválida. Usá un número o \`all\`.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (apuesta < MIN_APUESTA) {
        return interaction.reply({
          content: `${E.cruz || '❌'} La apuesta mínima es **${fmt$(MIN_APUESTA)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (apuesta > MAX_APUESTA) {
        return interaction.reply({
          content: `${E.cruz || '❌'} La apuesta máxima es **${fmt$(MAX_APUESTA)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (saldo < apuesta) {
        return interaction.reply({
          content: `${E.cruz || '❌'} Saldo insuficiente. Tenés **${fmt$(saldo)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const cobro = await restarSaldoExacto(userId, apuesta, {
        tipo: 'EGRESO',
        motivo: `Juego adivina-auto apuesta ${fmt$(apuesta)}`
      });
      if (!cobro.ok) {
        return interaction.reply({
          content: `${E.cruz || '❌'} No se pudo debitar la apuesta. Saldo: **${fmt$(cobro.saldo)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }

      partidasActivas.add(userId);
      const auto = pickAuto();
      const partidaId = `${userId.slice(-6)}_${Date.now().toString(36)}`;
      const letras = ['A', 'B', 'C', 'D'];

      const msg = await interaction.reply({
        embeds: [embedAdivina(auto, apuesta, interaction.user)],
        components: [botonesAuto(partidaId)],
        fetchReply: true
      });

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: PARTIDA_IDLE_MS,
        filter: (i) => i.customId.startsWith(`juego_auto:${partidaId}:`)
      });

      let resuelto = false;

      const finalizar = async (i, eleccionIdx) => {
        if (resuelto) return;
        resuelto = true;
        collector.stop('done');

        const acerto = eleccionIdx === auto.correcta;
        let saldoFinal;
        let texto;
        let color = PRIMARIO;

        if (acerto) {
          saldoFinal = await agregarSaldo(userId, apuesta * 2, {
            tipo: 'INGRESO',
            motivo: `Juego adivina-auto ganó ${fmt$(apuesta)} (pago 2x)`
          });
          texto =
            `${E.tilde || '✅'} **¡Correcto!** Era **${auto.nombre}**.\n` +
            `Ganaste **${fmt$(apuesta)}** (se devolvió la apuesta + premio).\n` +
            `**Saldo:** ${fmt$(saldoFinal)}`;
          color = '#57F287';
        } else {
          saldoFinal = await obtenerSaldo(userId);
          texto =
            `${E.cruz || '❌'} **Incorrecto.** Era **${auto.nombre}**.\n` +
            `Elegiste **${letras[eleccionIdx]} ${auto.opciones[eleccionIdx]}**.\n` +
            `Perdiste **${fmt$(apuesta)}**.\n` +
            `**Saldo:** ${fmt$(saldoFinal)}`;
          color = '#ED4245';
        }

        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`${E.auto || '🚗'} Adivina el auto — Resultado`)
          .setDescription(texto)
          .setTimestamp();

        const payload = { embeds: [embed], components: [botonesDeshabilitados()] };
        try {
          if (i && !i.replied && !i.deferred) await i.update(payload);
          else await msg.edit(payload);
        } catch {
          try {
            await msg.edit(payload);
          } catch {
            /* ignore */
          }
        }

        partidasActivas.delete(userId);
        setCooldown(userId);
      };

      collector.on('collect', async (i) => {
        if (i.user.id !== userId) {
          return i.reply({
            content: `${E.cruz || '❌'} Solo quien inició la partida puede responder.`,
            flags: MessageFlags.Ephemeral
          });
        }
        const parts = i.customId.split(':');
        const idx = parseInt(parts[2], 10);
        if (!Number.isFinite(idx) || idx < 0 || idx > 3) {
          return i.reply({ content: `${E.cruz || '❌'} Opción inválida.`, flags: MessageFlags.Ephemeral });
        }
        await finalizar(i, idx);
      });

      collector.on('end', async (_, reason) => {
        if (resuelto || reason === 'done') return;
        resuelto = true;
        try {
          const saldoFinal = await agregarSaldo(userId, apuesta, {
            tipo: 'INGRESO',
            motivo: `Juego adivina-auto timeout — reembolso ${fmt$(apuesta)}`
          });
          const embed = new EmbedBuilder()
            .setColor(PRIMARIO)
            .setTitle(`${E.auto || '🚗'} Adivina el auto — Tiempo agotado`)
            .setDescription(
              `${E.dot || '•'} No respondiste a tiempo. Se **reembolsó** tu apuesta de **${fmt$(apuesta)}**.\n` +
                `La respuesta era **${auto.nombre}**.\n**Saldo:** ${fmt$(saldoFinal)}`
            )
            .setTimestamp();
          await msg.edit({ embeds: [embed], components: [botonesDeshabilitados()] });
        } catch {
          /* ignore */
        }
        partidasActivas.delete(userId);
        setCooldown(userId);
      });

      return;
    }

    if (sub === 'slots') {
      const saldo = await obtenerSaldo(userId);
      const apuesta = parseApuesta(interaction.options.getString('cantidad'), saldo);
      if (apuesta == null) {
        return interaction.reply({
          content: `${E.cruz || '❌'} Cantidad inválida. Usá un número o \`all\`.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (apuesta < MIN_APUESTA) {
        return interaction.reply({
          content: `${E.cruz || '❌'} La apuesta mínima es **${fmt$(MIN_APUESTA)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (apuesta > MAX_APUESTA) {
        return interaction.reply({
          content: `${E.cruz || '❌'} La apuesta máxima es **${fmt$(MAX_APUESTA)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (saldo < apuesta) {
        return interaction.reply({
          content: `${E.cruz || '❌'} Saldo insuficiente. Tenés **${fmt$(saldo)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const cobro = await restarSaldoExacto(userId, apuesta, {
        tipo: 'EGRESO',
        motivo: `Juego slots apuesta ${fmt$(apuesta)}`
      });
      if (!cobro.ok) {
        return interaction.reply({
          content: `${E.cruz || '❌'} No se pudo debitar. Saldo: **${fmt$(cobro.saldo)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const simbolos = girarSlots();
      const res = resultadoSlots(simbolos);
      let texto;
      let color = PRIMARIO;
      let saldoFinal;

      if (res.multiplicador > 0) {
        const pago = Math.floor(apuesta * res.multiplicador);
        saldoFinal = await agregarSaldo(userId, pago, {
          tipo: 'INGRESO',
          motivo: `Juego slots ${res.tipo} pago ${fmt$(pago)}`
        });
        if (res.tipo === 'triple') {
          texto =
            `${E.tilde || '✅'} **¡Triple!** ${simbolos.join(' | ')}\n` +
            `Ganaste **${fmt$(pago)}** (x3).\n**Saldo:** ${fmt$(saldoFinal)}`;
          color = '#57F287';
        } else {
          texto =
            `${E.dot || '•'} **Empate (push).** ${simbolos.join(' | ')}\n` +
            `Se devolvió tu apuesta de **${fmt$(apuesta)}**.\n**Saldo:** ${fmt$(saldoFinal)}`;
        }
      } else {
        saldoFinal = await obtenerSaldo(userId);
        texto =
          `${E.cruz || '❌'} **Sin premio.** ${simbolos.join(' | ')}\n` +
          `Perdiste **${fmt$(apuesta)}**.\n**Saldo:** ${fmt$(saldoFinal)}`;
        color = '#ED4245';
      }

      setCooldown(userId);

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${E.dinero || '🎰'} Tragamonedas`)
        .setDescription(texto)
        .setFooter({ text: '3 iguales = x3 · 2 iguales = se devuelve la apuesta' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'moneda') {
      const eleccionPre = interaction.options.getString('eleccion');
      if (eleccionPre !== 'cara' && eleccionPre !== 'cruz') {
        return interaction.reply({
          content: `${E.cruz || '❌'} Para **Cara o cruz** debés elegir la opción **eleccion** (Cara o Cruz).`,
          flags: MessageFlags.Ephemeral
        });
      }
      const saldo = await obtenerSaldo(userId);
      const apuesta = parseApuesta(interaction.options.getString('cantidad'), saldo);
      const eleccion = interaction.options.getString('eleccion');

      if (apuesta == null) {
        return interaction.reply({
          content: `${E.cruz || '❌'} Cantidad inválida. Usá un número o \`all\`.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (apuesta < MIN_APUESTA) {
        return interaction.reply({
          content: `${E.cruz || '❌'} La apuesta mínima es **${fmt$(MIN_APUESTA)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (apuesta > MAX_APUESTA) {
        return interaction.reply({
          content: `${E.cruz || '❌'} La apuesta máxima es **${fmt$(MAX_APUESTA)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (saldo < apuesta) {
        return interaction.reply({
          content: `${E.cruz || '❌'} Saldo insuficiente. Tenés **${fmt$(saldo)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const cobro = await restarSaldoExacto(userId, apuesta, {
        tipo: 'EGRESO',
        motivo: `Juego moneda apuesta ${fmt$(apuesta)}`
      });
      if (!cobro.ok) {
        return interaction.reply({
          content: `${E.cruz || '❌'} No se pudo debitar. Saldo: **${fmt$(cobro.saldo)}**.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
      const gano = resultado === eleccion;
      let saldoFinal;
      let texto;
      let color = PRIMARIO;

      if (gano) {
        saldoFinal = await agregarSaldo(userId, apuesta * 2, {
          tipo: 'INGRESO',
          motivo: `Juego moneda ganó ${fmt$(apuesta)} (pago 2x)`
        });
        texto =
          `${E.tilde || '✅'} Salió **${resultado}**. ¡Acertaste!\n` +
          `Ganaste **${fmt$(apuesta)}**.\n**Saldo:** ${fmt$(saldoFinal)}`;
        color = '#57F287';
      } else {
        saldoFinal = await obtenerSaldo(userId);
        texto =
          `${E.cruz || '❌'} Salió **${resultado}**. Elegiste **${eleccion}**.\n` +
          `Perdiste **${fmt$(apuesta)}**.\n**Saldo:** ${fmt$(saldoFinal)}`;
        color = '#ED4245';
      }

      setCooldown(userId);

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${E.dinero || '🪙'} Cara o cruz`)
        .setDescription(texto)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  }
};
