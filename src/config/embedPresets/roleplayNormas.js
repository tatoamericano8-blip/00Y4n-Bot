import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

export default {
  id: 'roleplay_normas',
  label: 'Roleplay Normas (sesiones)',
  description: 'Reglamento dentro de las sesiones',

  build() {
    // Estilo GVRU: textos cortos, 3 embeds, total < 6000 chars
    const e1 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Normas dentro de las Sesiones`)
      .setDescription(
        `${E.dot} **1.** ${E.flecha} **Sentido común**\n` +
          `Usá siempre el sentido común. No hagas cosas inaceptables en un servidor de roleplay serio. Las excusas no anulan la infracción.\n\n` +
          `${E.dot} **2.** ${E.flecha} **Filtrar sesiones**\n` +
          `Filtrar o compartir enlaces privados de sesión (incluido FastPass) está prohibido y puede resultar en **ban permanente**.\n\n` +
          `${E.dot} **3.** ${E.flecha} **Combat logging**\n` +
          `Desconectarse o abandonar la sesión para evitar consecuencias de RP está prohibido y puede derivar en suspensión.\n\n` +
          `${E.dot} **4.** ${E.flecha} **Verificación**\n` +
          `Debés estar verificado en el Discord de 00Y4n para participar. Los no verificados pueden ser removidos.\n\n` +
          `${E.dot} **5.** ${E.flecha} **Fail Roleplay (FRP)**\n` +
          `No se permiten acciones irreales o que rompan la inmersión. Ejemplo: chocar a alta velocidad y seguir como si nada.\n\n` +
          `${E.dot} **6.** ${E.flecha} **Bloqueo de tráfico**\n` +
          `Bloquear el tráfico sin justificación de roleplay válida no está permitido.\n\n` +
          `${E.dot} **7.** ${E.flecha} **Roleplays prohibidos**\n` +
          `Está prohibido todo RP que viole los Términos de Roblox o Discord (RP sexual, suicidio, tiroteos escolares, drogas, etc.). Puede resultar en ban.\n\n` +
          `${E.dot} **8.** ${E.flecha} **Incorporación y carriles**\n` +
          `Dejá al menos ~4 espacios de vehículo al cambiar de carril. Usá intermitente. No aceleres para impedir que otro se incorpore. Cortar de forma agresiva está prohibido.`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const e2 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Normas dentro de las Sesiones`)
      .setDescription(
        `${E.dot} **9.** ${E.flecha} **Giros en U**\n` +
          `Permitidos salvo Peacetime estricto. Deben hacerse de forma segura. Provocar un choque por un giro imprudente puede sancionarse.\n\n` +
          `${E.dot} **10.** ${E.flecha} **Registro de vehículos**\n` +
          `Registrá tu vehículo con \`/matricular registrar\`. Circular sin matrícula puede dar lugar a control policial y multas.\n\n` +
          `${E.dot} **11.** ${E.flecha} **Vehículos restringidos**\n` +
          `Conducir un vehículo no autorizado puede resultar en expulsión de la sesión y strike. Si tenés excepción, coordiná antes con el host.\n\n` +
          `${E.dot} **12.** ${E.flecha} **Peacetime y límites FRP**\n` +
          `• **Estricto** → 75 MPH\n` +
          `• **Normal** → 85 MPH\n` +
          `• **Sin PT** → 120 MPH\n` +
          `Durante PT: 1 prioridad a la vez · cooldown 5 min · en prioridad máx. 145 MPH (salvo indicación del host).\n\n` +
          `${E.dot} **13.** ${E.flecha} **Licencias**\n` +
          `• **Activa** — al integrarte al sistema. 5 multas relevantes → revocación.\n` +
          `• **Revocada** — no conduzcas hasta regularizar con staff/policía.\n` +
          `• **Restablecida** — tras recuperación. Acumular 5 multas graves otra vez → sanción mayor.\n` +
          `• **Suspendida** — por infracciones graves. Conducir suspendido puede llevar a revocación.\n` +
          `Multas: \`/multar\` · pago: \`/pagar-multa\`.`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const e3 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Normas dentro de las Sesiones`)
      .setDescription(
        `${E.dot} **14.** ${E.flecha} **Conducción imprudente**\n` +
          `En Peacetime estricto y normal, el staff puede sancionar por múltiples colisiones, ignorar semáforos/señales de forma reiterada o maniobras claramente inseguras / antirol.\n\n` +
          `${E.dot} **15.** ${E.flecha} **Expulsiones de sesión**\n` +
          `Si te sacan sin sanción formal, en general podés volver. Si hubo warn/strike u otra sanción, no reingreses hasta que el staff lo autorice. Expulsiones permanentes requieren respaldo del staff.\n\n` +
          `${E.dot} **16.** ${E.flecha} **Suplantación**\n` +
          `Hacerte pasar por staff o fuerzas de seguridad sin el rol está prohibido. Para postularte a un departamento usá \`/solicitud-departamento\`.\n\n` +
          `*El host, co-host y el staff tienen la última palabra en sesión. Seguir jugando implica aceptar la versión vigente.*`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return { embeds: [e1, e2, e3] };
  }
};
