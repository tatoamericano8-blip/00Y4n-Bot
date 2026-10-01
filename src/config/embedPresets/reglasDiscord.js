import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

export default {
  id: 'reglas_discord',
  label: 'Reglamento Discord',
  description: 'Reglas oficiales del servidor + links',

  build() {
    const intro = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.manual} __**Reglamento oficial de 00Y4n.**__`)
      .setDescription(
        `A continuación encontrará las normas que usted, como miembro de nuestra comunidad, **debe seguir**. El incumplimiento de las mismas conllevará diversas **consecuencias** por parte de nuestro equipo de administración.`
      );

    const reglas = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setDescription(
        `${E.dot} **__1.__** ${E.flecha} **Conducta respetuosa:**\n` +
          `Todos los miembros deben tratarse con el máximo respeto, fomentando un ambiente de cortesía e inclusión. La discriminación, el discurso de odio y los ataques personales están estrictamente prohibidos. Independientemente de las diferencias, mantener un entorno respetuoso y acogedor es fundamental.\n\n` +
          `${E.dot} **__2.__** ${E.flecha} **No enviar spam:**\n` +
          `Para garantizar una comunicación organizada y sin distracciones, absténgase de enviar mensajes consecutivos o publicar contenido irrelevante. Comparta únicamente información que se ajuste al propósito del canal y que contribuya a debates e interacciones significativas.\n\n` +
          `${E.dot} **__3.__** ${E.flecha} **No publicar contenido inapropiado:**\n` +
          `Compartir o publicar contenido sexualmente explícito, sugerente, violento o inapropiado para la edad está estrictamente prohibido. Es importante mantener un espacio seguro y cómodo para miembros de todas las edades y procedencias.\n\n` +
          `${E.dot} **__4.__** ${E.flecha} **Confidencialidad:**\n` +
          `Respete la privacidad de todos los miembros de la comunidad. Abstente de divulgar información personal, incluyendo números de teléfono, direcciones o cualquier otro detalle sensible sobre ti o sobre otras personas. Proteger la privacidad personal es una prioridad.\n\n` +
          `${E.dot} **__5.__** ${E.flecha} **No se permite publicidad no autorizada:**\n` +
          `Es necesario obtener el consentimiento previo de los moderadores o propietarios del servidor antes de promocionar otros servidores de Discord, sitios web o servicios. La publicidad no solicitada interrumpe el enfoque y la integridad de la comunidad. Obtén permiso antes de compartir contenido externo.\n\n` +
          `${E.dot} **__6.__** ${E.flecha} **Normas específicas de cada canal:**\n` +
          `Además de las reglas generales del servidor, cada canal puede tener sus propias normas. Familiarízate con estas normas y síguelas para garantizar un entorno armonioso y organizado en cada canal.\n\n` +
          `${E.dot} **__7.__** ${E.flecha} **No se permite hackear ni hacer trampas:**\n` +
          `Está estrictamente prohibido hackear, hacer trampas o explotar vulnerabilidades de software o juegos. Defiende el juego limpio y mantén la integridad de las actividades de la comunidad. Estas acciones perjudican la experiencia de los demás y no serán toleradas.\n\n` +
          `${E.dot} **__8.__** ${E.flecha} **No suplantar identidades:**\n` +
          `Evita suplantar la identidad de otros miembros, personal o figuras conocidas de la comunidad. Representarte falsamente a otros puede generar confusión, desconfianza y problemas. Sé auténtico y usa tu propia identidad en todas tus interacciones.\n\n` +
          `${E.dot} **__9.__** ${E.flecha} **Cumplimiento de las normas del personal:**\n` +
          `Sigue con prontitud y respeto las instrucciones de los moderadores y el personal del servidor. Su responsabilidad es mantener el orden y garantizar un ambiente positivo. La cooperación con el personal contribuye a una experiencia fluida y agradable en la comunidad.\n\n` +
          `${E.dot} **__10.__** ${E.flecha} **Términos de servicio de Discord:**\n` +
          `Asegúrate de cumplir con los Términos de servicio de Discord en todo momento dentro de nuestro servidor. Incumplir los Términos de servicio conllevará medidas disciplinarias severas y, si se considera necesario, un reporte a Discord.`
      );

    const links = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.hyperlink} **Southwest Florida 00Y4n** - ***Links***`)
      .setDescription(
        `${E.dot} **Southwest Florida 00Y4n,** Link Discord: \`https://discord.gg/JfThUwz2d9\`\n` +
          `${E.dot} **Southwest Florida 00Y4n,** [Página de TikTok](https://www.tiktok.com/@00y4nsub)\n` +
          `${E.dot} **Southwest Florida 00Y4n,** [Comunidad de Roblox](https://www.roblox.com/es/communities/292739785/Clan-00Y4n#!/about)`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return { embeds: [intro, reglas, links] };
  }
};
