import {
    SlashCommandBuilder,
    EmbedBuilder
} from 'discord.js';
import { agregarSaldo } from '../../utils/gestorEconomia.js';
import { getFromDb, setInDb } from '../../utils/database.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

const ROL_POLICIA_ID = '1529146302783422706';
const ROL_ALTO_MANDO_ID = '1528870731629465752';
const CHANNEL_LOGS = '1529175493029531738';

const TIEMPO_UNION_MS = 80 * 1000;
const TIEMPO_ROBO_MS = 60 * 1000;
const COOLDOWN_MS = 12 * 60 * 60 * 1000;
const COOLDOWN_INTERVENIR_MS = 60 * 60 * 1000;
const MIN_PERSONAS = 2;
const MAX_PERSONAS = 3;
const RECOMPENSA_MIN = 10000;
const RECOMPENSA_MAX = 25000;
const CHANCE_EXITO = 60;
const NARRATIVA_INTERVAL_MS = 15 * 1000;
