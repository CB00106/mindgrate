import React from 'react';
import { motion } from 'framer-motion';

// Importa las imágenes desde la carpeta de imágenes
import heroImage from '../images/heroImage.png';
import cerebroImage from '../images/cerebroImage.png';
import ejmpeloimage from '../images/ejcolab.png';

// Interfaz para las props del FlipCard
interface FlipCardProps {
  title: string;
  subtitle?: string | React.ReactNode;
  backContent: React.ReactNode;
  width?: string;
  height?: string;
  frontImage?: string;
  frontImageAlt?: string;
}

// --- Componente Reutilizable para la Tarjeta con Animación ---
const FlipCard: React.FC<FlipCardProps> = ({ title, subtitle, backContent, width = '597px', height = '198px', frontImage, frontImageAlt }) => {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  function handleFlip() {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
      setIsAnimating(true);
    }
  }

  return (
    <div
      className="flip-card rounded-[13px] cursor-pointer"
      onClick={handleFlip}
      style={{ perspective: '1000px', width, height }}
    >
      <motion.div
        className="flip-card-inner w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        onAnimationComplete={() => setIsAnimating(false)}
      >        {/* Cara Frontal */}
        <div
          className="flip-card-front w-full h-full bg-white border-4 border-black rounded-[13px] flex flex-col items-center justify-center p-6 relative"
          style={{ backfaceVisibility: 'hidden', position: 'absolute' }}
        >          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">{title}</h2>
          {subtitle && (
            <div className="text-lg text-gray-600 text-left leading-relaxed mb-4">{subtitle}</div>
          )}
          
          {/* Imagen frontal si se proporciona */}
          {frontImage && (
            <img
              src={frontImage}
              alt={frontImageAlt || "Card image"}
              className="w-full max-w-sm h-auto rounded-lg shadow-lg mb-4"
            />
          )}
          
          {/* Flecha indicadora de volteo */}
          <div className="absolute bottom-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-45"
            >
              <path 
                d="M7 17L17 7M17 7H7M17 7V17" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>{/* Cara Trasera */}
        <div
          className="flip-card-back absolute w-full h-full bg-black text-white border-4 border-black rounded-[13px] flex items-center justify-center p-4"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center">
            {backContent}
          </div>
        </div>
      </motion.div>
    </div>  );
};

// Simple Waitlist Modal Component
interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold mb-4">¡Únete a la Lista de Espera!</h3>
        <p className="text-gray-600 mb-6">
          Sé el primero en conocer las nuevas funcionalidades de Mindgrate.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              // Aquí podrías agregar la lógica para registrar en la lista de espera
              alert('¡Gracias! Te contactaremos pronto.');
              onClose();
            }}
            className="flex-1 bg-[#2383e2] text-white py-2 px-4 rounded hover:bg-[#1d6ab8] transition-colors"
          >
            Registrarme
          </button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    // Contenedor principal sin márgenes ni padding
    <div className="bg-white font-sans min-h-screen w-screen m-0 p-0">
      {/* --- INICIO BLOQUE 1: HÉROE --- */}
      <section className="min-h-screen w-full flex items-center m-0 p-0">
        <div className="w-full h-full grid grid-cols-2 gap-16 items-center px-16">
            {/* Columna de Texto */}
          <div className="flex flex-col gap-8 pl-8">
            <h1 className="text-6xl font-bold text-gray-900 leading-tight">
              Una infraestructura colaborativa de <span className="text-[#2383e2]">inteligencia artificial</span>
            </h1>
            <p className="text-xl text-gray-700">
              Cada agente es una unidad inteligente que forma parte de una red segura, modular y adaptable. No es un chatbot. No es una suite. Es una nueva forma de operar.
            </p><div className="flex gap-4 mt-4">
                <button 
                onClick={() => {
                  document.getElementById('bloque-cerebro')?.scrollIntoView({ 
                  behavior: 'smooth' 
                  });
                }}
                className="bg-[#2383e2] text-white font-bold py-4 px-8 rounded-[13px] hover:bg-[#1d6ab8] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                Conoce Mas                </button>
              <a 
                href="https://form.typeform.com/to/bZkqm16V" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#ebf5fe] text-[#2383e2] font-bold py-4 px-8 rounded-[13px] border-2 border-[#2383e2] hover:bg-[#d6ebfd] transition-all duration-300 transform hover:scale-105 inline-block text-center"
              >
                Feedback
              </a>
            </div>
          </div>          <div className="flex justify-center items-center">
            <img 
              src={heroImage} 
              alt="Mindgrate Hero Image"
              className="w-full max-w-2xl h-auto" 
            />
          </div>
        </div>
      </section>
      {/* --- FIN BLOQUE 1: HÉROE --- */}       {/* --- INICIO BLOQUE 2: EL CEREBRO EMPRESARIAL --- */}
      <section id="bloque-cerebro" className="w-full flex items-center py-20 px-16">
        <div className="w-full h-full grid grid-cols-2 gap-16 items-center">
            {/* Columna de Cards */}            <div className="flex flex-col gap-8">
                <FlipCard 
                    title="Colaboración nativa"
                    subtitle="Agentes de IA especializados comparten contexto y resultados"
                    backContent={<p className="text-lg">Conecta agentes de IA especializados —finanzas, operaciones, atención al cliente— en un mismo entorno para compartir contexto y resultados sin intervención manual. <strong>Colaboración Nativa</strong>.</p>} 
                />
                <FlipCard 
                    title="Arquitectura modular"
                    subtitle="Ensamblas pequeñas inteligencias según tus necesidades"
                    backContent={<p className="text-lg">Despliega, actualiza o retira agentes plug-and-play según tus necesidades, ampliando capacidades sin tocar el núcleo del sistema. <strong>Arquitectura modular</strong>.</p>} 
                />
                <FlipCard 
                    title="Gobernanza total"
                    subtitle="Tu voz marca cuándo y cómo actúan los agentes" 
                    backContent={<p className="text-lg">Define políticas, niveles de acceso y aprobaciones de tareas desde un panel central; todo flujo entre agentes pasa por filtros configurables para mantenerte al control. <strong>Gobernanza total</strong>.</p>} 
                />
            </div>{/* Columna de Imagen */}
            <div className="flex justify-center items-center">
                 <img 
                    src={cerebroImage} 
                    alt="El Cerebro Empresarial"
                    className="w-full max-w-2xl h-auto"
                />
            </div>
        </div>      </section>
      {/* --- FIN BLOQUE 2: EL CEREBRO EMPRESARIAL --- */}


       {/* --- INICIO BLOQUE 3: MVP --- */}
      <section className="w-full flex items-center py-20 px-24">
        <div className="w-full grid grid-cols-2 gap-16 items-center">
            {/* Columna Izquierda: Texto */}
            <div className="flex flex-col gap-6">
                <h2 className="text-6xl font-bold text-black leading-tight">
                  Construyendo el Futuro, Juntos: <span className="text-[#2383e2]">Experimenta Nuestro MVP</span>
                </h2>
                <p className="text-xl text-gray-700">
                    Te presentamos la primera versión funcional de Mindgrate. No es el producto final, es una invitación para construir la siguiente fase con tu ayuda.
                </p>
                <p className="text-xl text-gray-700">
                    En esta etapa, puedes darle vida a tu propio agente de IA de una forma sencilla: subiendo un archivo CSV.
                </p>
            </div>            {/* Columna Derecha: Card Flip */}
            <div className="flex justify-center items-center">                 <FlipCard 
                title="En esta fase inicial"
                subtitle={
                  <ul className="text-left space-y-2">
                    <li><span className="text-[#2383e2]">Carga tus Datos:</span> Sube un archivo CSV con la información que consideres relevante (un inventario, un listado de tareas, un presupuesto).</li>
                    <li><span className="text-[#2383e2]">Activa tu Agente:</span> Tu agente personal asimilará esta información al instante.</li>
                    <li><span className="text-[#2383e2]">Ponlo a Prueba:</span> Realiza consultas basadas en los datos que cargaste y observa cómo tu agente te entrega respuestas y ejecuta tareas simples.</li>
                  </ul>
                }
                frontImage={ejmpeloimage}
                frontImageAlt="Ejemplo de Carga de CSV"
                backContent={
                  <div>
                    <h3 className="text-2xl font-bold mb-4">¿Por qué empezar con CSV?</h3>
                    <ul className="text-lg text-left space-y-3">
                      <li>
                        <strong>Validación del Núcleo:</strong> Los archivos CSV nos permiten probar la parte más crítica de nuestra tecnología —la capacidad de un agente para procesar, entender y utilizar datos de forma segura— en un entorno controlado.
                      </li>
                      <li>
                        <strong>Simplicidad Estructural:</strong> Empezar con datos estructurados nos permite perfeccionar la lógica de colaboración y gobernanza sin añadir la complejidad de interpretar docenas de formatos distintos.
                      </li>
                      <li>
                        <strong>El Primer Paso:</strong> Es el cimiento. Una vez que esta base sea robusta gracias a tu feedback, la expandiremos para conectar todo tipo de fuentes de información: desde documentos y correos hasta aplicaciones de terceros.
                      </li>
                    </ul>
                    <p className="text-lg mt-4 font-semibold">
                      Tu feedback es el ingrediente clave. Queremos saber qué funciona, qué no y qué te gustaría ver después.
                    </p>
                  </div>
                }
                width="600px"
                height="650px"
              />
            </div>
        </div>
      </section>
      {/* --- FIN BLOQUE 3: MVP --- */}

      {/* --- INICIO BLOQUE 4: INTELIGENCIA EN ACCIÓN --- */}
      <section className="w-full flex items-center py-20 px-16">
        <div className="w-full h-full grid grid-cols-2 gap-8 items-center">
            {/* Columna de Card grande */}
            <div className="flex justify-center">
                <FlipCard 
                    title="Optimización de Proyectos Estratégicos"
                    backContent={<p className="text-lg">De la desalineación al control total. Conecta a tu agente de Planificación con los de Finanzas y Recursos para analizar la viabilidad de nuevos proyectos. Mindgrate consolida datos, estima presupuestos y asigna talento automáticamente, presentando un plan de acción validado para que tú tomes la decisión final..</p>} 
                    width="600px" // Ajustado para un mejor layout
                    height="540px" // Ajustado para un mejor layout
                />
            </div>
             {/* Columna de 2 Cards pequeñas */}
            <div className="flex flex-col gap-8">
                 <FlipCard 
                    title="Gestión Proactiva de Riesgos"
                    backContent={<p className="text-lg">Anticípate a los problemas, no reacciones ante ellos. Tu agente de Compras puede detectar un retraso en la entrega de un proveedor. Inmediatamente, notifica al agente de Operaciones para evaluar el impacto en la producción y, de forma simultánea, el agente de Comunicación informa a los stakeholders clave. Todo antes de que se convierta en una crisis..</p>} 
                    width="100%"
                    height="256px"
                />
                 <FlipCard 
                    title="Capitalización del Conocimiento"
                    backContent={<p className="text-lg">Convierte el conocimiento en tu mejor activo. Imagina que un agente de atención al cliente encuentra una solución creativa para un caso atípico. Mindgrate captura ese aprendizaje al instante. La próxima vez que surja un problema similar, cualquier agente en la red podrá acceder a esa solución probada, mejorando la calidad y velocidad de tu servicio sin necesidad de reinventar la rueda..</p>} 
                    width="100%"
                    height="256px"
                />
            </div>
        </div>
      </section>
      {/* --- FIN BLOQUE 4: INTELIGENCIA EN ACCIÓN --- */}

       {/* --- INICIO BLOQUE 5: EVOLUCIÓN --- */}
      <section className="w-full flex items-center py-20 px-24">
        <div className="w-full grid grid-cols-2 gap-16 items-center">
            {/* Columna Izquierda: Texto y botones */}
            <div className="flex flex-col gap-6">
                <h2 className="text-6xl font-bold text-black leading-tight">
                  Sé Parte de Nuestra <span className="text-[#2383e2]">Evolución</span>
                </h2>
                <p className="text-xl text-gray-700">
                    El viaje de Mindgrate apenas comienza y tu perspectiva es nuestra brújula. El MVP es nuestro punto de partida, pero el destino lo construimos contigo.
                </p>                <div className="flex gap-4 mt-4">
                    {/* Reemplaza `a` con el componente `Link` de react-router-dom si es necesario */}
                    <a href="/login" className="bg-[#2383e2] text-white font-bold py-4 px-8 rounded-[13px] hover:bg-[#1d6ab8] transition-all duration-300 transform hover:scale-105 shadow-lg text-center">
                        Registrate Ahora
                    </a>
                    <a href="URL_SUPABASE_BUCKET/brochure.pdf" download className="bg-[#ebf5fe] text-[#2383e2] font-bold py-4 px-8 rounded-[13px] border-2 border-[#2383e2] hover:bg-[#d6ebfd] transition-all duration-300 transform hover:scale-105 text-center">
                        Descargar Brochure
                    </a>
                </div>
            </div>
            {/* Columna Derecha: Roadmap */}
            <div className="flex flex-col gap-6 p-8 bg-gray-50 rounded-lg">
                <h3 className="text-3xl font-bold text-dark-text">Próximamente en Mindgrate:</h3>                <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                        <span className="text-2xl text-[#2383e2]">🔗</span>
                        <div>
                            <h4 className="font-bold text-xl">Conexión Multi-fuente y Visualizaciones</h4>
                            <p className="text-gray-600">Conecta agentes a Google Drive, Notion, etc., y genera dashboards y Gantts con MCP.</p>
                        </div>
                    
                    </li>
                     <li className="flex items-start gap-3">
                        <span className="text-2xl text-[#2383e2]">⚡</span>
                        <div>
                            <h4 className="font-bold text-xl">Colaboración Inteligente (A2A)</h4>
                            <p className="text-gray-600">Activa la colaboración inteligente entre agentes para ejecutar tareas conjuntas bajo tu supervisión.</p>
                        </div>
                    </li>
                     <li className="flex items-start gap-3">
                        <span className="text-2xl text-[#2383e2]">🛡️</span>
                        <div>
                            <h4 className="font-bold text-xl">Gobernanza y Permisos Avanzados</h4>
                            <p className="text-gray-600">Control total sobre qué datos ve y qué acciones realiza cada agente.</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
      </section>
      {/* --- FIN BLOQUE 5: EVOLUCIÓN --- */}      {/* --- INICIO BLOQUE 6: LISTA DE ESPERA --- */}
      <section className="w-full bg-black text-white py-20 px-24">
        <div className="w-full grid grid-cols-2 gap-16 items-center">
          {/* Primer sub-contenedor: Texto principal */}
          <div className="flex justify-center items-center">
            <h2 className="text-5xl font-bold leading-tight text-center">
              ¿Quieres ser el primero en probar lo nuevo?
            </h2>
          </div>
          
          {/* Segundo sub-contenedor: CTA */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-2xl text-gray-300 text-center">
              Únete a nuestra lista de espera. No solo recibirás acceso
prioritario a las nuevas funcionalidades, sino que tendrás
un canal directo con nuestro equipo para influir en el
futuro de la inteligencia artificial colaborativa.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#2383e2] text-white font-bold py-4 px-10 rounded-[13px] hover:bg-[#1d6ab8] transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              ÚNETE A LA LISTA DE ESPERA
            </button>
          </div>
        </div>
      </section>
      {/* --- FIN BLOQUE 6: LISTA DE ESPERA --- */}
      
      {/* Renderiza el modal si está abierto */}
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />


      {/* Aquí iremos añadiendo los siguientes bloques */}


    </div>
  );
};

export default Home;
