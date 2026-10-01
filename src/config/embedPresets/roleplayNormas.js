import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/** Banner superior — reemplazá si caduca */
const IMG_RP_INFO =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548119383379939348/Roleplay_Informacion_1.png';

export default {
  id: 'roleplay_normas',
  label: 'Roleplay Normas (sesiones)',
  description: 'Reglamento completo dentro de las sesiones',

  build() {
    const banner = new EmbedBuilder().setColor(PRIMARIO).setImage(IMG_RP_INFO);

    const intro = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.aestrellas || E.aestrellitas} __Southwest Florida 00Y4n, Roleplay Información__ ${E.aestrellas || E.aestrellitas}`)
      .setDescription(
        `${E.dot} Para mantener un entorno de juego de rol realista y justo, todos los miembros deben cumplir con las normas que se detallan a continuación durante las sesiones activas. Es fundamental respetar estas normas en todo momento para garantizar un ambiente en el que sea posible desarrollar los escenarios de manera correcta y adecuada; el incumplimiento de las mismas puede conllevar medidas __disciplinarias__ o __consecuencias__ para los usuarios infractores.`
      );

    const p1 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} __Normas dentro de las Sesiones__`)
      .setDescription(
        `Al entrar a una sesión aceptás este reglamento, las reglas del Discord y los Términos de Servicio de Roblox.\n\n` +
          `*El incumplimiento puede derivar en advertencia, strike, expulsión de la sesión, suspensión o ban.*\n\n` +
          `${E.dot} __**1.**__ ${E.flecha} **Sentido común**\n` +
          `Usá siempre el sentido común. No hagas cosas inaceptables en un servidor de roleplay serio. Las excusas no anulan la infracción.\n\n` +
          `${E.dot} __**2.**__ ${E.flecha} **Filtrar sesiones**\n` +
          `Compartir o filtrar enlaces privados de sesión (incluido FastPass) está prohibido y puede resultar en ban permanente de la comunidad.\n\n` +
          `${E.dot} __**3.**__ ${E.flecha} **Combat logging**\n` +
          `Desconectarse o abandonar la sesión para evitar consecuencias de roleplay está prohibido y puede derivar en suspensión.\n\n` +
          `${E.dot} __**4.**__ ${E.flecha} **Verificación**\n` +
          `Debés estar verificado en el Discord de 00Y4n para participar. Los no verificados pueden ser removidos de la sesión.\n\n` +
          `${E.dot} __**5.**__ ${E.flecha} **Fail Roleplay (FRP)**\n` +
          `No se permiten acciones irreales o que rompan la inmersión.\n` +
          `Ejemplo: chocar a alta velocidad y seguir como si no hubiera pasado nada.\n\n` +
          `${E.dot} __**6.**__ ${E.flecha} **Bloqueo de tráfico**\n` +
          `Bloquear el tráfico sin justificación de roleplay válida no está permitido.\n\n` +
          `${E.dot} __**7.**__ ${E.flecha} **Roleplays prohibidos**\n` +
          `Está prohibido todo roleplay que viole los Términos de Roblox o Discord.\n` +
          `Incluye roleplay sexual, suicidio, tiroteos escolares, drogas ilegales y escenarios similares. Puede resultar en ban.\n\n` +
          `${E.dot} __**8.**__ ${E.flecha} **Incorporación y carriles**\n` +
          `- Dejá espacio suficiente al cambiar de carril (aprox. cuatro espacios de vehículo).\n` +
          `- Usá siempre el intermitente.\n` +
          `- No aceleres para impedir que otro se incorpore.\n` +
          `- Cortar de forma agresiva e irrealista está prohibido.`
      );

    const p2 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Normas dentro de las Sesiones`)
      .setDescription(
        `${E.dot} __**9.**__ ${E.flecha} **Giros en U**\n` +
          `Permitidos salvo Peacetime estricto. Deben hacerse de forma segura. Provocar un choque por un giro imprudente puede sancionarse.\n\n` +
          `${E.dot} __**10.**__ ${E.flecha} **Registro de vehículos**\n` +
          `Registrá tu vehículo con **/matricular registrar**. Circular sin matrícula puede dar lugar a control policial y multas.\n\n` +
          `${E.dot} __**11.**__ ${E.flecha} **Vehículos restringidos**\n` +
          `Conducir un vehículo no autorizado puede resultar en expulsión de la sesión y strike.\n` +
          `Si tenés una excepción, coordiná antes con el host de la sesión.\n\n` +
          `${E.dot} __**12.**__ ${E.flecha} **Peacetime y límites FRP**\n\n` +
          `- **Peacetime estricto** → límite FRP 75 MPH\n` +
          `- **Peacetime Normal** → límite FRP 85 MPH\n` +
          `- **Sin peacetime** → límite FRP 120 MPH\n\n` +
          `Durante Peacetime:\n` +
          `- Solo una prioridad a la vez\n` +
          `- Cooldown de 5 minutos entre prioridades\n` +
          `- En prioridad, máximo 145 MPH (salvo indicación del host)\n\n` +
          `*El host puede anunciar el estado de peacetime al iniciar o durante la sesión.*`
      );

    const p3 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Normas dentro de las Sesiones`)
      .setDescription(
        `${E.dot} __**13.**__ ${E.flecha} **Licencias de conducir**\n` +
          `El sistema se gestiona con los comandos oficiales de 00Y4n.\n\n` +
          `- **Licencia activa**: al integrarte al sistema. Cinco multas relevantes pueden derivar en revocación.\n` +
          `- **Licencia revocada**: no podés conducir de forma válida hasta regularizar con el staff / policía.\n` +
          `- **Licencia restablecida**: tras el proceso de recuperación. Acumular de nuevo cinco multas graves puede traer sanción mayor.\n` +
          `- **Licencia suspendida**: aplicada por infracciones graves. Conducir suspendido puede llevar a revocación.\n\n` +
          `Las multas se emiten y pagan con el bot (/pagar-multa, etc.).\n\n` +
          `${E.dot} __**14.**__ ${E.flecha} **Conducción imprudente**\n` +
          `En Peacetime estricto y Peacetime Normal, el staff puede sancionar por:\n` +
          `- múltiples colisiones\n` +
          `- ignorar semáforos o señales de forma reiterada\n` +
          `- maniobras claramente inseguras o de antirol\n\n` +
          `${E.dot} __**15.**__ ${E.flecha} **Expulsiones de sesión**\n` +
          `- Si te sacan sin sanción formal, en general podés volver a entrar.\n` +
          `- Si hubo advertencia, strike u otra sanción, no reingreses hasta que el staff lo autorice.\n` +
          `- Las expulsiones permanentes o restricciones largas requieren respaldo del staff.\n\n` +
          `${E.dot} __**16.**__ ${E.flecha} **Suplantación**\n` +
          `Hacerte pasar por staff o por fuerzas de seguridad sin el rol correspondiente está prohibido.\n` +
          `Para postularte a un departamento usá **/solicitud-departamento** o el canal de formularios.\n\n` +
          `────────────────────────────────\n` +
          `*El host, co-host y el staff tienen la última palabra en sesión.*\n` +
          `Este reglamento complementa las reglas del Discord.\n` +
          `Seguir jugando implica aceptar la versión vigente.`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return { embeds: [banner, intro, p1, p2, p3] };
  }
};
