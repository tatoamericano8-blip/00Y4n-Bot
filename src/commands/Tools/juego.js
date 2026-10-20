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
  // —— Compactos / hatch ——
  { nombre: 'Honda Civic Type R', anioMin: 2017, anioMax: 2024, pistas: ['Hatchback japonés de alto rendimiento', 'Línea Type R con alerón grande', 'Motor turbo ~2.0 y tracción delantera'], opciones: ['Ford F-150', 'Honda Civic', 'Toyota Camry', 'Chevrolet Silverado'], correcta: 1 },
  { nombre: 'Volkswagen Golf GTI', anioMin: 2015, anioMax: 2024, pistas: ['Hot hatch europeo clásico', 'Insignia GTI roja en la parrilla', 'Tracción delantera y chasis ágil'], opciones: ['Volkswagen Golf', 'BMW X5', 'Ram 1500', 'Mercedes-Benz S-Class'], correcta: 0 },
  { nombre: 'Volkswagen Golf R', anioMin: 2015, anioMax: 2024, pistas: ['Versión tope del Golf', 'Tracción integral 4MOTION', 'Más potencia que el GTI'], opciones: ['Toyota Prius', 'Volkswagen Golf', 'Honda Odyssey', 'Ford Transit'], correcta: 1 },
  { nombre: 'Toyota Corolla', anioMin: 2014, anioMax: 2025, pistas: ['Sedán compacto más vendido del mundo', 'Fiabilidad legendaria', 'Consumo bajo y mantenimiento barato'], opciones: ['Toyota Corolla', 'Lamborghini Huracán', 'Ford Mustang', 'Jeep Wrangler'], correcta: 0 },
  { nombre: 'Toyota GR Corolla', anioMin: 2023, anioMax: 2025, pistas: ['Hot hatch de Toyota Gazoo Racing', 'Tres cilindros turbo y AWD', 'Insignia GR y escapes triples'], opciones: ['Honda Fit', 'Toyota Corolla', 'Nissan Versa', 'Kia Rio'], correcta: 1 },
  { nombre: 'Mazda3', anioMin: 2014, anioMax: 2024, pistas: ['Compacto japonés de diseño premium', 'Chasis muy equilibrado', 'Interior de mejor calidad de su clase'], opciones: ['Chevrolet Tahoe', 'Mazda3', 'GMC Sierra', 'Porsche 911'], correcta: 1 },
  { nombre: 'Hyundai Elantra N', anioMin: 2022, anioMax: 2025, pistas: ['Sedán N de alto rendimiento', 'Escape con crujidos característicos', 'Asientos deportivos N'], opciones: ['Hyundai Elantra', 'Honda Odyssey', 'Tesla Model Y', 'Dodge Charger'], correcta: 0 },
  { nombre: 'Hyundai i30 N', anioMin: 2018, anioMax: 2024, pistas: ['Hot hatch coreano', 'Desarrollado en Nürburgring', 'Modos de conducción N'], opciones: ['Ford Focus', 'Hyundai i30', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 1 },
  { nombre: 'Honda Civic Si', anioMin: 2017, anioMax: 2024, pistas: ['Civic deportivo intermedio', 'Manual de serie', 'Menos extremo que el Type R'], opciones: ['Honda Civic', 'Ram 2500', 'Chevrolet Suburban', 'GMC Yukon'], correcta: 0 },
  { nombre: 'Ford Focus ST', anioMin: 2013, anioMax: 2018, pistas: ['Hot hatch americano/europeo', 'Insignia ST', 'Turbo de cuatro cilindros'], opciones: ['Toyota Camry', 'Ford Focus', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Ford Focus RS', anioMin: 2016, anioMax: 2018, pistas: ['Focus de tracción integral', 'Color azul Nitrous famoso', 'Modo drift disponible'], opciones: ['Ford Focus', 'Honda CR-V', 'Toyota RAV4', 'Mazda CX-5'], correcta: 0 },
  { nombre: 'Renault Mégane RS', anioMin: 2018, anioMax: 2023, pistas: ['Hot hatch francés', 'Chasis Cup opcional', 'Famoso en circuitos europeos'], opciones: ['Jeep Cherokee', 'Renault Mégane', 'Ford Explorer', 'Chevrolet Traverse'], correcta: 1 },
  { nombre: 'Peugeot 308 GTi', anioMin: 2016, anioMax: 2021, pistas: ['Hot hatch francés', 'Volante pequeño característico', 'Asientos deportivos firmes'], opciones: ['Peugeot 308', 'Toyota Tundra', 'Ford F-250', 'Ram 1500'], correcta: 0 },
  { nombre: 'Mini Cooper S', anioMin: 2014, anioMax: 2024, pistas: ['Hatch británico compacto', 'Diseño icónico redondo', 'Turbo y manejo ágil'], opciones: ['Chevrolet Malibu', 'Mini Cooper', 'Toyota Avalon', 'Hyundai Sonata'], correcta: 1 },
  { nombre: 'Mini John Cooper Works', anioMin: 2015, anioMax: 2024, pistas: ['Mini de máximo rendimiento', 'Insignia JCW', 'Suspensión más firme que Cooper S'], opciones: ['Mini Cooper', 'Honda Odyssey', 'Chrysler Voyager', 'Toyota Sienna'], correcta: 0 },
  { nombre: 'Subaru WRX', anioMin: 2015, anioMax: 2024, pistas: ['Sedán turbo AWD japonés', 'Motor bóxer característico', 'Heredero de rally'], opciones: ['Toyota Prius', 'Subaru WRX', 'Honda Insight', 'Hyundai Ioniq'], correcta: 1 },
  { nombre: 'Subaru WRX STI', anioMin: 2015, anioMax: 2021, pistas: ['WRX de competición de calle', 'Alerón grande y insignia STI', 'Diferencial central ajustable'], opciones: ['Subaru WRX', 'Ford Escape', 'Honda HR-V', 'Mazda CX-30'], correcta: 0 },
  { nombre: 'Mitsubishi Lancer Evolution X', anioMin: 2008, anioMax: 2015, pistas: ['Sedán rally japonés legendario', 'Sistema AWD Super All-Wheel Control', 'Última generación Evo'], opciones: ['Honda Fit', 'Mitsubishi Lancer', 'Toyota Yaris', 'Nissan Versa'], correcta: 1 },
  { nombre: 'Volkswagen Jetta GLI', anioMin: 2019, anioMax: 2024, pistas: ['Sedán deportivo del Grupo VW', 'Mecánica cercana al GTI', 'Aspecto discreto de sedán'], opciones: ['Volkswagen Jetta', 'Ford Expedition', 'Chevrolet Tahoe', 'GMC Yukon'], correcta: 0 },
  { nombre: 'Honda Fit', anioMin: 2015, anioMax: 2020, pistas: ['Supermini japonés', 'Interior Magic Seat muy versátil', 'Ideal ciudad y bajo consumo'], opciones: ['Ford Mustang', 'Honda Fit', 'Chevrolet Corvette', 'Dodge Challenger'], correcta: 1 },

  // —— Sedanes medianos / familiares ——
  { nombre: 'Toyota Camry', anioMin: 2018, anioMax: 2025, pistas: ['Sedán mediano rey de flotas en EE.UU.', 'Opción híbrida muy eficiente', 'Confort y espacio trasero'], opciones: ['Toyota Camry', 'Ferrari 488', 'Can-Am Maverick', 'Ford Bronco'], correcta: 0 },
  { nombre: 'Honda Accord', anioMin: 2018, anioMax: 2025, pistas: ['Sedán mediano japonés de referencia', 'Buena dinámica de manejo', 'Híbrido disponible en últimas gens'], opciones: ['Nissan GT-R', 'Honda Accord', 'Jeep Grand Cherokee', 'Chevrolet Corvette'], correcta: 1 },
  { nombre: 'Nissan Altima', anioMin: 2019, anioMax: 2025, pistas: ['Sedán mediano japonés', 'Disponible con AWD', 'Pantalla grande en generaciones recientes'], opciones: ['Nissan Altima', 'Lamborghini Aventador', 'Porsche 911', 'McLaren 720S'], correcta: 0 },
  { nombre: 'Mazda6', anioMin: 2014, anioMax: 2021, pistas: ['Sedán mediano de diseño premium', 'Acabados superiores a su precio', 'Manejo más deportivo que rivales'], opciones: ['Ford F-150', 'Mazda6', 'Ram 1500', 'Chevrolet Silverado'], correcta: 1 },
  { nombre: 'Hyundai Sonata', anioMin: 2020, anioMax: 2025, pistas: ['Sedán mediano coreano', 'Diseño futurista reciente', 'Versión N-Line deportiva'], opciones: ['Hyundai Sonata', 'Jeep Wrangler', 'Ford Bronco', 'Toyota 4Runner'], correcta: 0 },
  { nombre: 'Kia K5', anioMin: 2021, anioMax: 2025, pistas: ['Sedán mediano coreano (ex Optima)', 'Diseño agresivo de cupé-sedán', 'GT con turbo disponible'], opciones: ['Honda CR-V', 'Kia K5', 'Toyota RAV4', 'Mazda CX-5'], correcta: 1 },
  { nombre: 'Subaru Legacy', anioMin: 2020, anioMax: 2025, pistas: ['Sedán AWD de serie', 'Motor bóxer', 'Orientado a confort y seguridad'], opciones: ['Subaru Legacy', 'Chevrolet Camaro', 'Ford Mustang', 'Dodge Challenger'], correcta: 0 },
  { nombre: 'Volkswagen Passat', anioMin: 2016, anioMax: 2022, pistas: ['Sedán mediano europeo', 'Espacio interior generoso', 'Orientado a confort de viaje'], opciones: ['Toyota Tacoma', 'Volkswagen Passat', 'Ford Ranger', 'Chevrolet Colorado'], correcta: 1 },
  { nombre: 'Skoda Octavia', anioMin: 2017, anioMax: 2024, pistas: ['Liftback checo del Grupo VW', 'Maletero enorme', 'Buena relación espacio-precio'], opciones: ['Skoda Octavia', 'Ferrari Roma', 'Lamborghini Urus', 'Bentley Continental'], correcta: 0 },

  // —— Lujo / performance sedanes ——
  { nombre: 'BMW M3', anioMin: 2015, anioMax: 2025, pistas: ['Sedán deportivo bávaro de referencia', 'Línea M con riñones grandes (G80)', 'RWD o xDrive, escape M'], opciones: ['BMW M3', 'Toyota Prius', 'Honda CR-V', 'Ford Transit'], correcta: 0 },
  { nombre: 'BMW M5', anioMin: 2018, anioMax: 2025, pistas: ['Sedán ejecutivo de alto rendimiento', 'V8 biturbo', 'Modo 4WD desconectable en F90'], opciones: ['Honda Civic', 'BMW M5', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'BMW 330i', anioMin: 2019, anioMax: 2025, pistas: ['Sedán compacto premium Serie 3', 'Motor 2.0 turbo', 'Equilibrio lujo-deportividad'], opciones: ['BMW 3 Series', 'Ford F-350', 'Ram 3500', 'Chevrolet Silverado HD'], correcta: 0 },
  { nombre: 'Mercedes-Benz C63 AMG', anioMin: 2015, anioMax: 2023, pistas: ['C-Class de AMG', 'V8 biturbo en generación W205', 'Sonido y prestigio AMG'], opciones: ['Kia Rio', 'Mercedes-Benz C-Class', 'Honda Civic', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Mercedes-Benz E63 AMG', anioMin: 2017, anioMax: 2024, pistas: ['E-Class de máximo rendimiento', 'V8 biturbo y AWD 4MATIC+', 'Berlina de lujo muy rápida'], opciones: ['Mercedes-Benz E-Class', 'Toyota Yaris', 'Honda Fit', 'Mitsubishi Mirage'], correcta: 0 },
  { nombre: 'Mercedes-Benz S-Class', anioMin: 2014, anioMax: 2025, pistas: ['Buque insignia de lujo alemán', 'Tecnología y confort máximos', 'Referencia del segmento F'], opciones: ['Ford Fiesta', 'Mercedes-Benz S-Class', 'Chevrolet Spark', 'Honda Fit'], correcta: 1 },
  { nombre: 'Audi RS7', anioMin: 2014, anioMax: 2025, pistas: ['Sportback de altas prestaciones', 'Quattro y V8 biturbo', 'Aspecto de gran turismo discreto'], opciones: ['Audi RS7', 'Toyota Yaris', 'Ford Fiesta', 'Chevrolet Spark'], correcta: 0 },
  { nombre: 'Audi RS3', anioMin: 2017, anioMax: 2025, pistas: ['Compacto premium radical', 'Motor 5 cilindros característico', 'Quattro y escape RS'], opciones: ['Honda Odyssey', 'Audi RS3', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 1 },
  { nombre: 'Audi S4', anioMin: 2017, anioMax: 2025, pistas: ['A4 de orientación deportiva', 'Quattro de serie', 'V6 turbo en generaciones recientes'], opciones: ['Audi S4', 'Jeep Renegade', 'Ford EcoSport', 'Honda HR-V'], correcta: 0 },
  { nombre: 'Alfa Romeo Giulia Quadrifoglio', anioMin: 2016, anioMax: 2025, pistas: ['Sedán italiano de alma deportiva', 'Insignia Quadrifoglio verde', 'Motor V6 Ferrari-derived'], opciones: ['Alfa Romeo Giulia', 'Ford F-250', 'Chevrolet Suburban', 'GMC Yukon'], correcta: 0 },
  { nombre: 'Lexus IS 500', anioMin: 2022, anioMax: 2025, pistas: ['Sedán compacto de lujo japonés', 'V8 atmosférico 5.0', 'Sonido aspirado en era turbo'], opciones: ['Honda Civic', 'Lexus IS', 'Toyota Prius', 'Nissan Versa'], correcta: 1 },
  { nombre: 'Lexus RC F', anioMin: 2015, anioMax: 2025, pistas: ['Cupé de lujo japonés', 'V8 atmosférico', 'Rival de BMW M4 en su época'], opciones: ['Lexus RC', 'Ford Escape', 'Honda CR-V', 'Toyota RAV4'], correcta: 0 },
  { nombre: 'Cadillac CT5-V Blackwing', anioMin: 2022, anioMax: 2025, pistas: ['Sedán performance americano tope', 'V8 sobrealimentado', 'Manual disponible en Blackwing'], opciones: ['Cadillac CT5', 'Honda Fit', 'Toyota Yaris', 'Mitsubishi Mirage'], correcta: 0 },
  { nombre: 'Genesis G70', anioMin: 2019, anioMax: 2025, pistas: ['Sedán de lujo coreano', 'Buena dinámica y precio', 'Marca premium de Hyundai'], opciones: ['Ford Bronco', 'Genesis G70', 'Jeep Wrangler', 'Toyota Tacoma'], correcta: 1 },
  { nombre: 'Genesis G80', anioMin: 2021, anioMax: 2025, pistas: ['Sedán ejecutivo coreano', 'Interior muy lujoso por el precio', 'Competidor de Serie 5 / E-Class'], opciones: ['Genesis G80', 'Honda Civic', 'Toyota Corolla', 'Nissan Sentra'], correcta: 0 },
  { nombre: 'Kia Stinger GT', anioMin: 2018, anioMax: 2023, pistas: ['Fastback deportivo coreano', 'V6 biturbo en GT', 'Estilo gran turismo'], opciones: ['Kia Stinger', 'Honda Odyssey', 'Toyota Sienna', 'Chrysler Voyager'], correcta: 0 },
  { nombre: 'Infiniti Q50 Red Sport', anioMin: 2016, anioMax: 2024, pistas: ['Sedán japonés de lujo deportivo', 'V6 biturbo Red Sport 400', 'Dirección electrónica variable'], opciones: ['Ram 1500', 'Infiniti Q50', 'Ford F-150', 'Chevrolet Silverado'], correcta: 1 },
  { nombre: 'Acura TLX Type S', anioMin: 2021, anioMax: 2025, pistas: ['Sedán deportivo de lujo Acura', 'Turbo V6 y SH-AWD', 'Insignia Type S roja'], opciones: ['Acura TLX', 'Toyota Corolla', 'Honda Civic base', 'Nissan Versa'], correcta: 0 },
  { nombre: 'Jaguar XE SV Project 8', anioMin: 2018, anioMax: 2019, pistas: ['Sedán británico extremo de SV', 'Alerón enorme de circuito', 'Producción muy limitada'], opciones: ['Honda Fit', 'Jaguar XE', 'Toyota Yaris', 'Kia Rio'], correcta: 1 },

  // —— Muscle / pony ——
  { nombre: 'Ford Mustang GT', anioMin: 2015, anioMax: 2025, pistas: ['Pony car americano icónico', 'V8 Coyote 5.0 en GT', 'Tracción trasera'], opciones: ['Ford Mustang', 'Toyota Prius', 'Honda Insight', 'Nissan Leaf'], correcta: 0 },
  { nombre: 'Ford Mustang Dark Horse', anioMin: 2024, anioMax: 2025, pistas: ['Mustang S650 de alto rendimiento', 'Sustituto espiritual del Mach 1', 'V8 y chasis endurecido'], opciones: ['Honda CR-V', 'Ford Mustang', 'Toyota RAV4', 'Mazda CX-5'], correcta: 1 },
  { nombre: 'Ford Mustang Shelby GT500', anioMin: 2020, anioMax: 2022, pistas: ['Mustang más potente de calle', 'V8 sobrealimentado ~760 hp', 'Insignia Shelby'], opciones: ['Ford Mustang', 'Honda Odyssey', 'Chrysler Pacifica', 'Toyota Sienna'], correcta: 0 },
  { nombre: 'Chevrolet Camaro SS', anioMin: 2016, anioMax: 2024, pistas: ['Muscle coupe americano', 'V8 LT1 en SS', 'Rival directo del Mustang'], opciones: ['Toyota Camry', 'Chevrolet Camaro', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Chevrolet Camaro ZL1', anioMin: 2017, anioMax: 2024, pistas: ['Camaro de máximo rendimiento', 'V8 sobrealimentado LT4', 'Alerón y frenos de competición'], opciones: ['Chevrolet Camaro', 'Honda Fit', 'Toyota Yaris', 'Kia Rio'], correcta: 0 },
  { nombre: 'Dodge Challenger SRT Hellcat', anioMin: 2015, anioMax: 2023, pistas: ['Muscle coupe retro', 'V8 Hellcat sobrealimentado', 'Estilo años 70 modernizado'], opciones: ['Dodge Challenger', 'Honda Civic', 'Toyota Corolla', 'Nissan Sentra'], correcta: 0 },
  { nombre: 'Dodge Challenger SRT Demon', anioMin: 2018, anioMax: 2018, pistas: ['Challenger orientado a drag racing', 'Transmisión preparada para 1/4 de milla', 'Producción limitada 2018'], opciones: ['Ford Escape', 'Dodge Challenger', 'Honda CR-V', 'Toyota RAV4'], correcta: 1 },
  { nombre: 'Dodge Charger Hellcat', anioMin: 2015, anioMax: 2023, pistas: ['Sedán muscular de 4 puertas', 'V8 Hellcat sobrealimentado', 'Uno de los sedanes más potentes de serie'], opciones: ['Dodge Charger', 'Toyota Prius', 'Honda Insight', 'Hyundai Ioniq'], correcta: 0 },
  { nombre: 'Dodge Charger Daytona', anioMin: 2024, anioMax: 2025, pistas: ['Charger de nueva generación', 'Versión eléctrica de alto rendimiento', 'Nombre histórico Daytona'], opciones: ['Honda Fit', 'Dodge Charger', 'Toyota Yaris', 'Nissan Versa'], correcta: 1 },

  // —— Deportivos / super ——
  { nombre: 'Chevrolet Corvette C7 Stingray', anioMin: 2014, anioMax: 2019, pistas: ['Deportivo americano motor delantero', 'Última C7 antes del mid-engine', 'Techo targa disponible'], opciones: ['Honda Fit', 'Chevrolet Corvette', 'Toyota Yaris', 'Kia Rio'], correcta: 1 },
  { nombre: 'Chevrolet Corvette C8', anioMin: 2020, anioMax: 2025, pistas: ['Corvette con motor central', 'Cambio radical de arquitectura', 'Stingray y Z06 disponibles'], opciones: ['Chevrolet Corvette', 'Honda Odyssey', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 0 },
  { nombre: 'Chevrolet Corvette Z06 (C8)', anioMin: 2023, anioMax: 2025, pistas: ['C8 de pista', 'V8 LT6 atmosférico de altas revoluciones', 'Alerón y aerodinámica extrema'], opciones: ['Toyota Camry', 'Chevrolet Corvette', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Porsche 911 Carrera', anioMin: 2012, anioMax: 2025, pistas: ['Deportivo alemán motor trasero', 'Silueta 911 inconfundible', 'Referencia de deportivo usable'], opciones: ['Porsche 911', 'Ford F-150', 'Ram 1500', 'Chevrolet Silverado'], correcta: 0 },
  { nombre: 'Porsche 911 GT3', anioMin: 2018, anioMax: 2025, pistas: ['911 orientado a circuito', 'Motor atmosférico de altas rpm', 'Alerón fijo característico'], opciones: ['Honda CR-V', 'Porsche 911', 'Toyota RAV4', 'Mazda CX-5'], correcta: 1 },
  { nombre: 'Porsche 718 Cayman GT4', anioMin: 2020, anioMax: 2024, pistas: ['Cupé motor central de Porsche', 'Sin asientos traseros', 'GT4 con bóxer atmosférico'], opciones: ['Porsche Cayman', 'Honda Odyssey', 'Toyota Sienna', 'Kia Carnival'], correcta: 0 },
  { nombre: 'Porsche Taycan', anioMin: 2020, anioMax: 2025, pistas: ['Sedán deportivo 100% eléctrico', 'Plataforma PPE de Porsche', 'Aceleración brutal en Turbo S'], opciones: ['Toyota Prius', 'Porsche Taycan', 'Honda Insight', 'Nissan Leaf'], correcta: 1 },
  { nombre: 'Nissan GT-R', anioMin: 2012, anioMax: 2024, pistas: ['Godzilla japonés', 'AWD ATTESA y biturbo V6', 'Leyenda de rendimiento por precio'], opciones: ['Nissan GT-R', 'Ford Fiesta', 'Honda Fit', 'Chevrolet Spark'], correcta: 0 },
  { nombre: 'Toyota GR Supra', anioMin: 2020, anioMax: 2025, pistas: ['Cupé deportivo en colaboración con BMW', 'Motor 6 en línea turbo', 'Heredero del nombre Supra'], opciones: ['Honda Civic', 'Toyota Supra', 'Nissan Sentra', 'Hyundai Elantra'], correcta: 1 },
  { nombre: 'Toyota GR86', anioMin: 2022, anioMax: 2025, pistas: ['Cupé ligero de propulsión trasera', 'Desarrollado con Subaru (BRZ)', 'Motor bóxer y diversión pura'], opciones: ['Toyota GR86', 'Ford Expedition', 'Chevrolet Tahoe', 'GMC Yukon'], correcta: 0 },
  { nombre: 'Subaru BRZ', anioMin: 2022, anioMax: 2025, pistas: ['Hermano del GR86', 'RWD y bóxer', 'Enfoque en balance y feel'], opciones: ['Ram 2500', 'Subaru BRZ', 'Ford F-250', 'Chevrolet Silverado HD'], correcta: 1 },
  { nombre: 'Mazda MX-5 Miata', anioMin: 2016, anioMax: 2025, pistas: ['Roadster ligero japonés', 'Referencia de diversión al volante', 'Techo blando o RF hardtop'], opciones: ['Mazda MX-5', 'Ford F-150', 'Ram 1500', 'Toyota Tundra'], correcta: 0 },
  { nombre: 'Jaguar F-Type', anioMin: 2014, anioMax: 2024, pistas: ['Deportivo británico elegante', 'Escape con crepitar característico', 'Cupé o convertible'], opciones: ['Honda CR-V', 'Jaguar F-Type', 'Toyota RAV4', 'Ford Escape'], correcta: 1 },
  { nombre: 'Chevrolet Corvette E-Ray', anioMin: 2024, anioMax: 2025, pistas: ['Corvette híbrido AWD', 'Motor delantero eléctrico + V8 central', 'Primera C8 electrificada de calle'], opciones: ['Chevrolet Corvette', 'Honda Fit', 'Toyota Yaris', 'Kia Rio'], correcta: 0 },
  { nombre: 'Lotus Emira', anioMin: 2022, anioMax: 2025, pistas: ['Deportivo británico mid-engine', 'Último Lotus de combustión pura (plan)', 'Enfoque en ligereza y feel'], opciones: ['Toyota Camry', 'Lotus Emira', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Alpine A110', anioMin: 2018, anioMax: 2025, pistas: ['Cupé francés ultra ligero', 'Motor central trasero', 'Espíritu de rally modernizado'], opciones: ['Alpine A110', 'Ford Explorer', 'Chevrolet Traverse', 'Honda Pilot'], correcta: 0 },
  { nombre: 'McLaren 720S', anioMin: 2017, anioMax: 2023, pistas: ['Superdeportivo británico', 'V8 biturbo de McLaren', 'Puertas dihedral doors'], opciones: ['Honda Civic', 'McLaren 720S', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Ferrari 488 GTB', anioMin: 2015, anioMax: 2019, pistas: ['Ferrari mid-engine V8 biturbo', 'Sucesor del 458', 'Insignia del cavallino'], opciones: ['Ferrari 488', 'Ford F-150', 'Ram 1500', 'Chevrolet Silverado'], correcta: 0 },
  { nombre: 'Ferrari F8 Tributo', anioMin: 2019, anioMax: 2023, pistas: ['Evolución del 488', 'V8 biturbo muy potente', 'Homenaje a los V8 de Maranello'], opciones: ['Toyota Prius', 'Ferrari F8', 'Honda Insight', 'Nissan Leaf'], correcta: 1 },
  { nombre: 'Lamborghini Huracán', anioMin: 2014, anioMax: 2024, pistas: ['Superdeportivo italiano V10', 'Diseño angular agresivo', 'AWD en la mayoría de versiones'], opciones: ['Lamborghini Huracán', 'Honda Odyssey', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 0 },
  { nombre: 'Lamborghini Aventador', anioMin: 2012, anioMax: 2022, pistas: ['Flagship V12 de Lamborghini', 'Puertas de tijera', 'Presencia extrema'], opciones: ['Ford Fiesta', 'Lamborghini Aventador', 'Chevrolet Spark', 'Honda Fit'], correcta: 1 },
  { nombre: 'Audi R8', anioMin: 2016, anioMax: 2023, pistas: ['Superdeportivo de Audi con V10', 'Parentesco con Lamborghini Huracán', 'Quattro y diseño de cabina adelantada'], opciones: ['Audi R8', 'Toyota Corolla', 'Honda Civic', 'Nissan Sentra'], correcta: 0 },

  // —— SUV / crossover ——
  { nombre: 'Toyota RAV4', anioMin: 2019, anioMax: 2025, pistas: ['SUV compacto más popular', 'Híbrido muy demandado', 'Altura de manejo y AWD opcional'], opciones: ['Toyota RAV4', 'Porsche 911', 'Ferrari 488', 'McLaren 720S'], correcta: 0 },
  { nombre: 'Honda CR-V', anioMin: 2017, anioMax: 2025, pistas: ['SUV compacto japonés best-seller', 'Espacio y practicidad', 'Híbrido en generaciones recientes'], opciones: ['Ford Mustang', 'Honda CR-V', 'Chevrolet Camaro', 'Dodge Challenger'], correcta: 1 },
  { nombre: 'Mazda CX-5', anioMin: 2017, anioMax: 2025, pistas: ['SUV compacto de diseño KODO', 'Manejo más deportivo del segmento', 'Interior cuidado'], opciones: ['Mazda CX-5', 'Ford F-150', 'Ram 1500', 'Chevrolet Silverado'], correcta: 0 },
  { nombre: 'Hyundai Tucson', anioMin: 2022, anioMax: 2025, pistas: ['SUV compacto coreano', 'Diseño paramétrico de luces', 'Híbrido e híbrido enchufable'], opciones: ['Honda Civic', 'Hyundai Tucson', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Kia Sportage', anioMin: 2023, anioMax: 2025, pistas: ['SUV compacto hermano del Tucson', 'Diseño frontal vertical llamativo', 'Buena equipación de serie'], opciones: ['Kia Sportage', 'Ferrari Roma', 'Lamborghini Huracán', 'McLaren Artura'], correcta: 0 },
  { nombre: 'Ford Bronco', anioMin: 2021, anioMax: 2025, pistas: ['SUV off-road de carrocería separada', 'Estilo retro del Bronco clásico', 'Capaz en caminos difíciles'], opciones: ['Toyota Camry', 'Ford Bronco', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Ford Bronco Sport', anioMin: 2021, anioMax: 2025, pistas: ['Bronco sobre plataforma de Escape', 'Más urbano que el Bronco grande', 'Unibody y menor tamaño'], opciones: ['Ford Bronco Sport', 'Porsche 911', 'Chevrolet Corvette', 'Nissan GT-R'], correcta: 0 },
  { nombre: 'Jeep Wrangler', anioMin: 2018, anioMax: 2025, pistas: ['SUV off-road icónico', 'Puertas y techo desmontables', '4x4 de verdad para trails'], opciones: ['Honda Fit', 'Jeep Wrangler', 'Toyota Yaris', 'Kia Rio'], correcta: 1 },
  { nombre: 'Jeep Grand Cherokee', anioMin: 2014, anioMax: 2025, pistas: ['SUV mediano premium de Jeep', 'Versiones SRT y Trackhawk potentes', 'Lujo + capacidad 4x4'], opciones: ['Jeep Grand Cherokee', 'Honda Civic', 'Toyota Corolla', 'Nissan Sentra'], correcta: 0 },
  { nombre: 'Toyota 4Runner', anioMin: 2010, anioMax: 2024, pistas: ['SUV body-on-frame japonés', 'Leyenda de durabilidad off-road', 'Aspecto boxy clásico'], opciones: ['Ford Mustang', 'Toyota 4Runner', 'Chevrolet Camaro', 'Dodge Challenger'], correcta: 1 },
  { nombre: 'Toyota Land Cruiser', anioMin: 2008, anioMax: 2025, pistas: ['SUV de lujo y expedición', 'Fiabilidad extrema en todo el mundo', '250 Series en la última gen'], opciones: ['Toyota Land Cruiser', 'Honda Fit', 'Toyota Yaris', 'Mitsubishi Mirage'], correcta: 0 },
  { nombre: 'Land Rover Defender', anioMin: 2020, anioMax: 2025, pistas: ['Off-roader británico reinventado', 'Diseño angular moderno', 'Capacidad extrema off-road'], opciones: ['Honda Civic', 'Land Rover Defender', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Land Rover Range Rover', anioMin: 2013, anioMax: 2025, pistas: ['SUV de lujo británico de referencia', 'Interior ultra premium', 'Capaz off-road pese al lujo'], opciones: ['Range Rover', 'Ford Fiesta', 'Chevrolet Spark', 'Honda Fit'], correcta: 0 },
  { nombre: 'BMW X5 M', anioMin: 2015, anioMax: 2025, pistas: ['SUV de alto rendimiento bávaro', 'V8 biturbo M', 'Aspecto musculoso de X5'], opciones: ['Toyota Prius', 'BMW X5', 'Honda Insight', 'Nissan Leaf'], correcta: 1 },
  { nombre: 'Mercedes-Benz G-Class', anioMin: 2019, anioMax: 2025, pistas: ['G-Wagen de diseño cuadrado icónico', 'Lujo y capacidad off-road', 'AMG G63 muy popular'], opciones: ['Mercedes-Benz G-Class', 'Honda Civic', 'Toyota Corolla', 'Nissan Versa'], correcta: 0 },
  { nombre: 'Porsche Cayenne', anioMin: 2018, anioMax: 2025, pistas: ['SUV deportivo de Porsche', 'Dinámica sorprendente para su tamaño', 'Versiones Turbo y GTS'], opciones: ['Ford F-150', 'Porsche Cayenne', 'Ram 1500', 'Chevrolet Silverado'], correcta: 1 },
  { nombre: 'Porsche Macan', anioMin: 2015, anioMax: 2025, pistas: ['SUV compacto deportivo de Porsche', 'Manejo de referencia en su clase', 'GTS y Turbo destacados'], opciones: ['Porsche Macan', 'Honda Odyssey', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 0 },
  { nombre: 'Tesla Model Y', anioMin: 2020, anioMax: 2025, pistas: ['SUV crossover eléctrico más vendido', 'Autopilot y pantalla central enorme', 'Marca Tesla'], opciones: ['Toyota Camry', 'Tesla Model Y', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Tesla Model X', anioMin: 2016, anioMax: 2025, pistas: ['SUV eléctrico con puertas falcon wing', 'Gran autonomía y aceleración', 'Marca Tesla'], opciones: ['Tesla Model X', 'Honda Fit', 'Toyota Yaris', 'Kia Rio'], correcta: 0 },

  // —— Pickups ——
  { nombre: 'Ford F-150', anioMin: 2015, anioMax: 2025, pistas: ['Pickup más vendida de EE.UU.', 'Cabina y caja configurables', 'Versiones Raptor y Lightning'], opciones: ['Ford F-150', 'Porsche 911', 'Ferrari 488', 'McLaren 720S'], correcta: 0 },
  { nombre: 'Ford F-150 Raptor', anioMin: 2017, anioMax: 2025, pistas: ['F-150 de alto rendimiento off-road', 'Suspensión de largo recorrido', 'Insignia Raptor y ancho extra'], opciones: ['Honda Civic', 'Ford F-150', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Ford F-150 Lightning', anioMin: 2022, anioMax: 2025, pistas: ['F-150 100% eléctrica', 'Gran torque instantáneo', 'Frunk delantero amplio'], opciones: ['Ford F-150', 'Honda Odyssey', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 0 },
  { nombre: 'Chevrolet Silverado 1500', anioMin: 2019, anioMax: 2025, pistas: ['Pickup full-size de GM', 'Rival directo de F-150 y Ram', 'Cabinas dobles muy comunes'], opciones: ['Toyota Prius', 'Chevrolet Silverado', 'Honda Insight', 'Nissan Leaf'], correcta: 1 },
  { nombre: 'Chevrolet Colorado ZR2', anioMin: 2017, anioMax: 2025, pistas: ['Pickup mediana off-road de Chevy', 'Suspensión Multimatic en ZR2', 'Tamaño más manejable que 1500'], opciones: ['Chevrolet Colorado', 'Ferrari Roma', 'Lamborghini Huracán', 'McLaren Artura'], correcta: 0 },
  { nombre: 'Ram 1500', anioMin: 2019, anioMax: 2025, pistas: ['Pickup full-size de Stellantis', 'Interior más premium del segmento', 'Suspensión multilink trasera'], opciones: ['Honda Fit', 'Ram 1500', 'Toyota Yaris', 'Kia Rio'], correcta: 1 },
  { nombre: 'Ram 1500 TRX', anioMin: 2021, anioMax: 2024, pistas: ['Ram con motor Hellcat', 'Pickup de alto rendimiento off-road', 'Potencia extrema en caja abierta'], opciones: ['Ram 1500', 'Honda Civic', 'Toyota Corolla', 'Nissan Sentra'], correcta: 0 },
  { nombre: 'Toyota Tacoma', anioMin: 2016, anioMax: 2025, pistas: ['Pickup mediana japonesa legendaria', 'Valor de reventa altísimo', 'TRD Off-Road y TRD Pro'], opciones: ['Ford Mustang', 'Toyota Tacoma', 'Chevrolet Camaro', 'Dodge Challenger'], correcta: 1 },
  { nombre: 'Toyota Tundra', anioMin: 2022, anioMax: 2025, pistas: ['Pickup full-size de Toyota', 'Nueva generación con i-FORCE MAX', 'Rival de F-150 en fiabilidad'], opciones: ['Toyota Tundra', 'Porsche 911', 'Nissan GT-R', 'Chevrolet Corvette'], correcta: 0 },
  { nombre: 'Ford Ranger Raptor', anioMin: 2019, anioMax: 2025, pistas: ['Ranger de alto rendimiento off-road', 'Suspensión Fox y aspecto ancho', 'Pickup mediana radical'], opciones: ['Honda CR-V', 'Ford Ranger', 'Toyota RAV4', 'Mazda CX-5'], correcta: 1 },
  { nombre: 'GMC Sierra AT4', anioMin: 2019, anioMax: 2025, pistas: ['Sierra orientada a off-road/lujo aventura', 'Insignia AT4', 'Hermana premium de Silverado'], opciones: ['GMC Sierra', 'Honda Fit', 'Toyota Yaris', 'Nissan Versa'], correcta: 0 },
  { nombre: 'Jeep Gladiator', anioMin: 2020, anioMax: 2025, pistas: ['Única pickup basada en Wrangler', 'Puertas desmontables y 4x4 serio', 'Caja de carga abierta'], opciones: ['Toyota Camry', 'Jeep Gladiator', 'Honda Accord', 'Nissan Altima'], correcta: 1 },

  // —— Eléctricos / híbridos destacados ——
  { nombre: 'Tesla Model 3', anioMin: 2018, anioMax: 2025, pistas: ['Sedán eléctrico más influyente', 'Minimalismo interior con pantalla', 'Autopilot de Tesla'], opciones: ['Tesla Model 3', 'Ford F-150', 'Ram 1500', 'Chevrolet Silverado'], correcta: 0 },
  { nombre: 'Tesla Model S Plaid', anioMin: 2021, anioMax: 2025, pistas: ['Sedán eléctrico de altísimas prestaciones', 'Tres motores y aceleración absurda', 'Marca Tesla tope de gama'], opciones: ['Honda Civic', 'Tesla Model S', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Rivian R1T', anioMin: 2022, anioMax: 2025, pistas: ['Pickup eléctrica de aventura', 'Capacidad off-road y “gear tunnel”', 'Marca Rivian'], opciones: ['Rivian R1T', 'Honda Fit', 'Toyota Yaris', 'Kia Rio'], correcta: 0 },
  { nombre: 'Rivian R1S', anioMin: 2022, anioMax: 2025, pistas: ['SUV eléctrico hermano del R1T', 'Hasta 7 asientos', 'Enfoque aventura eléctrica'], opciones: ['Ford Mustang', 'Rivian R1S', 'Chevrolet Camaro', 'Dodge Challenger'], correcta: 1 },
  { nombre: 'Ford Mustang Mach-E', anioMin: 2021, anioMax: 2025, pistas: ['SUV crossover eléctrico con nombre Mustang', 'GT de alta potencia disponible', 'No es un pony car clásico'], opciones: ['Ford Mustang Mach-E', 'Honda Odyssey', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 0 },
  { nombre: 'Hyundai Ioniq 5', anioMin: 2022, anioMax: 2025, pistas: ['Crossover eléctrico coreano', 'Diseño retro-futurista', 'Plataforma E-GMP de carga rápida'], opciones: ['Toyota Prius', 'Hyundai Ioniq 5', 'Honda Insight', 'Nissan Leaf'], correcta: 1 },
  { nombre: 'Hyundai Ioniq 5 N', anioMin: 2024, anioMax: 2025, pistas: ['Ioniq 5 de alto rendimiento N', 'Sonido simulado y drift mode', 'Eléctrico radical de Hyundai N'], opciones: ['Hyundai Ioniq 5', 'Ford F-150', 'Ram 1500', 'Chevrolet Silverado'], correcta: 0 },
  { nombre: 'Kia EV6', anioMin: 2022, anioMax: 2025, pistas: ['Crossover eléctrico de Kia', 'Misma base que Ioniq 5', 'Diseño fastback llamativo'], opciones: ['Honda Civic', 'Kia EV6', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Polestar 2', anioMin: 2021, anioMax: 2025, pistas: ['Fastback eléctrico de Polestar', 'Orígenes Volvo', 'Orientación más conductual que un Tesla'], opciones: ['Polestar 2', 'Ford Fiesta', 'Chevrolet Spark', 'Honda Fit'], correcta: 0 },
  { nombre: 'BMW i4 M50', anioMin: 2022, anioMax: 2025, pistas: ['Sedán eléctrico deportivo de BMW', 'Doble motor y aspecto M', 'Basado en la Serie 4 Gran Coupé'], opciones: ['Toyota Camry', 'BMW i4', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Lucid Air', anioMin: 2022, anioMax: 2025, pistas: ['Sedán eléctrico de lujo', 'Autonomía entre las mejores del mercado', 'Marca Lucid'], opciones: ['Lucid Air', 'Honda Fit', 'Toyota Yaris', 'Kia Rio'], correcta: 0 },

  // —— Clásicos modernos / iconos extra ——
  { nombre: 'Dodge Viper ACR', anioMin: 2016, anioMax: 2017, pistas: ['V10 americano extremo', 'Orientado a records en circuito', 'Últimas unidades muy cotizadas'], opciones: ['Honda Civic', 'Dodge Viper', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Nissan 370Z', anioMin: 2012, anioMax: 2020, pistas: ['Cupé japonés asequible', 'Motor V6 atmosférico delantero', 'Precursor del Z moderno'], opciones: ['Nissan 370Z', 'Ford Expedition', 'Chevrolet Tahoe', 'GMC Yukon'], correcta: 0 },
  { nombre: 'Nissan Z', anioMin: 2023, anioMax: 2025, pistas: ['Sucesor del 370Z', 'Turbo V6 y estilo retro', 'Manual disponible'], opciones: ['Honda CR-V', 'Nissan Z', 'Toyota RAV4', 'Mazda CX-5'], correcta: 1 },
  { nombre: 'Honda S2000', anioMin: 2000, anioMax: 2009, pistas: ['Roadster japonés de altas rpm', 'Motor F20C legendario', 'Clásico de los 2000'], opciones: ['Honda S2000', 'Ford F-150', 'Ram 1500', 'Chevrolet Silverado'], correcta: 0 },
  { nombre: 'Toyota MR2 Spyder', anioMin: 2000, anioMax: 2007, pistas: ['Roadster mid-engine asequible', 'Ligero y equilibrado', 'Generación W30'], opciones: ['Toyota Camry', 'Toyota MR2', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Pontiac GTO (2004-2006)', anioMin: 2004, anioMax: 2006, pistas: ['Muscle australiano vendido como Pontiac', 'Basado en Holden Monaro', 'V8 y propulsión trasera'], opciones: ['Pontiac GTO', 'Honda Fit', 'Toyota Yaris', 'Kia Rio'], correcta: 0 },
  { nombre: 'Holden Commodore', anioMin: 2006, anioMax: 2017, pistas: ['Sedán australiano de propulsión trasera', 'Base de varios Pontiac/Chevy SS', 'Culto en Oceanía'], opciones: ['Ford Mustang', 'Holden Commodore', 'Chevrolet Camaro', 'Dodge Challenger'], correcta: 1 },
  { nombre: 'BMW M2', anioMin: 2016, anioMax: 2025, pistas: ['Cupé compacto M de BMW', 'Muy equilibrado y divertido', 'G87 en la última generación'], opciones: ['BMW M2', 'Toyota Prius', 'Honda Insight', 'Nissan Leaf'], correcta: 0 },
  { nombre: 'BMW M4', anioMin: 2015, anioMax: 2025, pistas: ['Cupé Serie 4 de alto rendimiento', 'Rival del C63 y RS5', 'Alerón y escapes M'], opciones: ['Honda Civic', 'BMW M4', 'Toyota Corolla', 'Nissan Sentra'], correcta: 1 },
  { nombre: 'Mercedes-AMG GT', anioMin: 2015, anioMax: 2025, pistas: ['Gran turismo de motor delantero AMG', 'V8 biturbo', 'Estilo más superdeportivo que sedán'], opciones: ['Mercedes-AMG GT', 'Honda Odyssey', 'Toyota Sienna', 'Chrysler Pacifica'], correcta: 0 },
  { nombre: 'Aston Martin Vantage', anioMin: 2018, anioMax: 2025, pistas: ['GT británico elegante', 'Motor Mercedes-AMG en la gen actual', 'Diseño de lujo deportivo'], opciones: ['Ford Fiesta', 'Aston Martin Vantage', 'Chevrolet Spark', 'Honda Fit'], correcta: 1 },
  { nombre: 'Bentley Continental GT', anioMin: 2018, anioMax: 2025, pistas: ['Gran turismo británico de lujo', 'W12 o V8 potentes', 'Interior artesanal'], opciones: ['Bentley Continental GT', 'Honda Civic', 'Toyota Corolla', 'Nissan Versa'], correcta: 0 },
  { nombre: 'Rolls-Royce Cullinan', anioMin: 2018, anioMax: 2025, pistas: ['SUV ultra lujo de Rolls-Royce', 'Parrilla Pantheon imponente', 'Máximo confort y prestigio'], opciones: ['Toyota Camry', 'Rolls-Royce Cullinan', 'Honda Accord', 'Nissan Altima'], correcta: 1 },
  { nombre: 'Bugatti Chiron', anioMin: 2016, anioMax: 2024, pistas: ['Hiperdeportivo W16', 'Velocidad máxima extrema', 'Marca Bugatti'], opciones: ['Bugatti Chiron', 'Honda Fit', 'Toyota Yaris', 'Kia Rio'], correcta: 0 },
  { nombre: 'Koenigsegg Jesko', anioMin: 2021, anioMax: 2025, pistas: ['Hiperdeportivo sueco', 'Caja Light Speed Transmission', 'Enfoque en velocidad y pista'], opciones: ['Ford F-150', 'Koenigsegg Jesko', 'Ram 1500', 'Chevrolet Silverado'], correcta: 1 }
];

const SLOT_SIMBOLOSconst SLOT_SIMBOLOS = ['🔔', '⭐', '🍋', '💎', '7️⃣', '🍒'];

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
