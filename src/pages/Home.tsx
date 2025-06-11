import React from 'react';
import { motion } from 'framer-motion';
// Importa las imágenes desde la carpeta de imágenes
import heroImage from '../images/heroImage.png';
import cerebroImage from '../images/cerebroImage.png';
import ejmpeloimage from '../images/ejcolab.png';

/// Interfaz para las props del FlipCard
interface FlipCardProps {
  title: string;
  subtitle?: string | React.ReactNode;
  backContent: React.ReactNode;
  className?: string; // Para clases de tamaño responsivas
  frontImage?: string;
  frontImageAlt?: string;
}

// --- Componente Reutilizable para la Tarjeta con Animación ---
const FlipCard: React.FC<FlipCardProps> = ({ title, subtitle, backContent, className = '', frontImage, frontImageAlt }) => {
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
      className={`flip-card rounded-[13px] cursor-pointer ${className}`}
      onClick={handleFlip}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="flip-card-inner w-full h-full"
        style={{ transformStyle: 'preserve-3d', position: 'relative' }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        onAnimationComplete={() => setIsAnimating(false)}
      >
        {/* Cara Frontal */}
        <div
          className="flip-card-front absolute w-full h-full bg-white border-4 border-black rounded-[13px] flex flex-col items-center justify-center p-4 md:p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">{title}</h2>
          {subtitle && (
            <div className="text-base md:text-lg text-gray-600 text-left leading-relaxed mb-4 px-2">{subtitle}</div>
          )}
          {frontImage && (
            <img
              src={frontImage}
              alt={frontImageAlt || "Card image"}
              className="w-full max-w-xs md:max-w-sm h-auto rounded-lg shadow-lg mb-4"
            />
          )}
          <div className="absolute bottom-4 right-4 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-45">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {/* Cara Trasera */}
        <div
          className="flip-card-back absolute w-full h-full bg-black text-white border-4 border-black rounded-[13px] flex items-center justify-center p-4 md:p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center">{backContent}</div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Componente del Modal para la Lista de Espera ---
interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg max-w-md w-full mx-auto">
        <h3 className="text-xl md:text-2xl font-bold mb-4">¡Únete a la Lista de Espera!</h3>        <p className="text-gray-600 mb-6">Sé el primero en conocer las nuevas funcionalidades de Mindgrate.</p>
        <div className="flex flex-row gap-3 sm:gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-[13px] hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
          >
            Cerrar
          </button>
          <button
            onClick={() => { alert('¡Gracias! Te contactaremos pronto.'); onClose(); }}
            className="flex-1 bg-[#2383e2] text-white font-semibold py-3 px-4 rounded-[13px] hover:bg-[#1d6ab8] transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center text-sm sm:text-base"
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
    <div className="bg-white font-sans w-full m-0 p-0 overflow-x-hidden">

      {/* --- INICIO BLOQUE 1: HÉROE --- */}
      <section className="min-h-screen w-full flex items-center p-4 md:p-8 lg:px-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start lg:pl-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Una infraestructura colaborativa de <span className="text-[#2383e2]">inteligencia artificial</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl">
              Cada agente es una unidad inteligente que forma parte de una red segura, modular y adaptable. No es un chatbot. No es una suite. Es una nueva forma de operar.
            </p>            <div className="flex flex-row gap-3 sm:gap-4 mt-4">
              <button onClick={() => { document.getElementById('bloque-cerebro')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="flex-1 bg-[#2383e2] text-white font-bold py-3 px-4 sm:px-6 md:py-4 md:px-8 rounded-[13px] hover:bg-[#1d6ab8] transition-all duration-300 transform hover:scale-105 shadow-lg text-center text-sm sm:text-base flex items-center justify-center">
                Conoce Más
              </button>
              <a href="https://form.typeform.com/to/bZkqm16V" target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-[#ebf5fe] text-[#2383e2] font-bold py-3 px-4 sm:px-6 md:py-4 md:px-8 rounded-[13px] border-2 border-[#2383e2] hover:bg-[#d6ebfd] transition-all duration-300 transform hover:scale-105 text-center text-sm sm:text-base flex items-center justify-center">
                Feedback
              </a>
            </div>
          </div>
          <div className="flex justify-center items-center">
            <img src={heroImage} alt="Mindgrate Hero Image" className="w-full max-w-md lg:max-w-2xl h-auto" />
          </div>
        </div>
      </section>

      {/* --- INICIO BLOQUE 2: EL CEREBRO EMPRESARIAL --- */}
      <section id="bloque-cerebro" className="w-full flex items-center py-16 md:py-20 px-4 md:px-8 lg:px-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-center lg:items-start gap-8">
            <FlipCard title="Colaboración nativa" subtitle="Agentes de IA especializados comparten contexto y resultados" backContent={<p className="text-lg p-2">Conecta agentes de IA especializados en un mismo entorno para compartir contexto y resultados sin intervención manual.</p>} className="w-full max-w-[597px] h-[198px]" />
            <FlipCard title="Arquitectura modular" subtitle="Ensamblas pequeñas inteligencias según tus necesidades" backContent={<p className="text-lg p-2">Despliega, actualiza o retira agentes plug-and-play según tus necesidades, ampliando capacidades sin tocar el núcleo del sistema.</p>} className="w-full max-w-[597px] h-[198px]" />
            <FlipCard title="Gobernanza total" subtitle="Tu voz marca cuándo y cómo actúan los agentes" backContent={<p className="text-lg p-2">Define políticas, niveles de acceso y aprobaciones de tareas desde un panel central para mantenerte al control.</p>} className="w-full max-w-[597px] h-[198px]" />
          </div>
          <div className="hidden lg:flex justify-center items-center">
            <img src={cerebroImage} alt="El Cerebro Empresarial" className="w-full max-w-2xl h-auto" />
          </div>
        </div>
      </section>

      {/* --- INICIO BLOQUE 3: MVP --- */}
      <section className="w-full flex items-center py-16 md:py-20 px-4 md:px-8 lg:px-24">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black leading-tight">
              Construyendo el Futuro, Juntos: <span className="text-[#2383e2]">Experimenta Nuestro MVP</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-700">
              Te presentamos la primera versión funcional de Mindgrate. No es el producto final, es una invitación para construir la siguiente fase con tu ayuda.
            </p>
          </div>
          <div className="flex justify-center items-center">
            <FlipCard title="En esta fase inicial"
              subtitle={
                <ul className="text-left space-y-2 text-sm md:text-base">
                  <li><strong className="text-[#2383e2]">Carga tus Datos:</strong> Sube un archivo CSV con la información que consideres relevante.</li>
                  <li><strong className="text-[#2383e2]">Activa tu Agente:</strong> Tu agente personal asimilará esta información al instante.</li>
                  <li><strong className="text-[#2383e2]">Ponlo a Prueba:</strong> Realiza consultas y observa cómo tu agente te entrega respuestas.</li>
                </ul>
              }
              frontImage={ejmpeloimage} frontImageAlt="Ejemplo de Carga de CSV"
              backContent={
                <div className="p-2">
                  <h3 className="text-xl md:text-2xl font-bold mb-4">¿Por qué empezar con CSV?</h3>
                  <p className="text-base md:text-lg">Nos permite probar y perfeccionar la parte más crítica de nuestra tecnología: la capacidad de un agente para procesar, entender y utilizar datos de forma segura.</p>
                </div>
              }
              className="w-full max-w-[600px] h-[600px] md:h-[650px]"
            />
          </div>
        </div>
      </section>
      {/* --- INICIO BLOQUE 3.5: TRANSFORMACIÓN --- */}
            <section className="w-full py-16 md:py-20 px-4 md:px-8 lg:px-24 text-center">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black leading-tight mb-4">
                    Transforma tu Operación
                </h2>
                <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
                    Convierte procesos complejos en flujos de trabajo inteligentes, proactivos y automatizados.
                </p>
            </section>
            {/* --- FIN BLOQUE 3.5: TRANSFORMACIÓN --- */}

      {/* --- INICIO BLOQUE 4: INTELIGENCIA EN ACCIÓN --- */}
      <section className="w-full flex items-center py-16 md:py-20 px-4 md:px-8 lg:px-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
            <FlipCard 
              title="Optimización de Proyectos Estratégicos" 
              subtitle="Alinea recursos, presupuesto y tiempo de forma inteligente."
              backContent={<p className="text-lg p-2">Analiza la viabilidad de nuevos proyectos, consolida datos, estima presupuestos y asigna talento automáticamente.</p>} 
              className="w-full max-w-[600px] h-[350px] lg:h-[540px]" 
            />
            </div>
            <div className="flex flex-col gap-8">
                <FlipCard title="Detección Proactiva de Riesgos" subtitle="Anticípate a los problemas antes de que se conviertan en crisis" backContent={<p className="text-lg p-2">Anticípate a los problemas antes de que se conviertan en crisis, notificando a los agentes y personas clave.</p>} className="w-full h-[256px]" />
                <FlipCard title="Capitalización del Conocimiento" subtitle="Convierte la experiencia de tu equipo en un activo reutilizable" backContent={<p className="text-lg p-2">Captura aprendizajes al instante y hazlos accesibles para toda la red, mejorando la calidad y velocidad de tu servicio.</p>} className="w-full h-[256px]" />
            </div>
        </div>
      </section>
      

      {/* --- INICIO BLOQUE 5: EVOLUCIÓN --- */}
      <section className="w-full flex items-center py-16 md:py-20 px-4 md:px-8 lg:px-24">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black leading-tight">
              Sé Parte de Nuestra <span className="text-[#2383e2]">Evolución</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-700">
              El viaje de Mindgrate apenas comienza y tu perspectiva es nuestra brújula.
            </p>            <div className="flex flex-row gap-3 sm:gap-4 mt-4 self-center lg:self-start">
              <a href="/login" className="flex-1 bg-[#2383e2] text-white font-bold py-3 px-4 sm:px-6 md:py-4 md:px-8 rounded-[13px] hover:bg-[#1d6ab8] transition-colors shadow-lg text-center text-sm sm:text-base flex items-center justify-center">Registrate Ahora</a>
              <a href="URL_SUPABASE_BUCKET/brochure.pdf" download className="flex-1 bg-[#ebf5fe] text-[#2383e2] font-bold py-3 px-4 sm:px-6 md:py-4 md:px-8 rounded-[13px] border-2 border-[#2383e2] hover:bg-[#d6ebfd] transition-colors text-center text-sm sm:text-base flex items-center justify-center">Descargar Brochure</a>
            </div>
          </div>
          <div className="flex flex-col gap-6 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-2xl md:text-3xl font-bold text-dark-text">Próximamente en Mindgrate:</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><span className="text-2xl text-[#2383e2]">🔗</span><div><h4 className="font-bold text-xl">Conexión Multi-fuente y Visualizaciones</h4><p className="text-gray-600">Conecta agentes a tus herramientas y genera dashboards y Gantts.</p></div></li>
              <li className="flex items-start gap-3"><span className="text-2xl text-[#2383e2]">⚡</span><div><h4 className="font-bold text-xl">Colaboración Inteligente (A2A)</h4><p className="text-gray-600">Activa la colaboración entre agentes para ejecutar tareas conjuntas.</p></div></li>
              <li className="flex items-start gap-3"><span className="text-2xl text-[#2383e2]">🛡️</span><div><h4 className="font-bold text-xl">Gobernanza y Permisos Avanzados</h4><p className="text-gray-600">Control total sobre los datos y acciones de cada agente.</p></div></li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- INICIO BLOQUE 6: LISTA DE ESPERA --- */}
      <section className="w-full bg-black text-white py-16 md:py-20 px-4 md:px-8 lg:px-24">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              ¿Quieres ser el primero en probar lo nuevo?
            </h2>
          </div>
          <div className="flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">
            <p className="text-lg md:text-2xl text-gray-300">
              Únete a nuestra lista de espera y tendrás un canal directo con nuestro equipo para influir en el futuro de la IA colaborativa.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#2383e2] text-white font-bold py-4 px-10 rounded-[13px] hover:bg-[#1d6ab8] transition-colors transform hover:scale-105 shadow-lg">
              ÚNETE A LA LISTA DE ESPERA
            </button>
          </div>
        </div>
      </section>
      {/* --- fin bloque 6: LISTA DE ESPERA --- */}
      {/* --- INICIO BLOQUE 7: FOOTER --- */}

      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
};

export default Home;
