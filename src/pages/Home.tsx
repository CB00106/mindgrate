import React from 'react';
import { motion } from 'framer-motion';
import supabase from '@/services/supabaseClient';
import { logger } from '@/utils/logger';
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
  const [email, setEmail] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Reset modal state when opening
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setIsSubmitted(false);
      setIsLoading(false);
      setError('');
    }
  }, [isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Insertar el correo en la tabla v1_waitlist de Supabase
      const { data, error: supabaseError } = await supabase
        .from('v1_waitlist')
        .insert([
          { email: email.toLowerCase().trim() }
        ])
        .select();

      if (supabaseError) {
        // Manejar error de correo duplicado
        if (supabaseError.code === '23505') { // Código de error para violación de constraint UNIQUE
          setError('Este correo ya está registrado en nuestra lista de espera.');
          return;
        }
        
        logger.error('Error de Supabase:', supabaseError);
        throw new Error(supabaseError.message || 'Error al guardar en la base de datos');
      }

      logger.log('Correo registrado exitosamente:', data);
      setIsSubmitted(true);
      
    } catch (err) {
      logger.error('Error al registrar correo:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Hubo un problema al registrar tu correo. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 md:p-8 rounded-lg max-w-md w-full mx-auto shadow-xl"
      >
        {!isSubmitted ? (
          // Formulario de registro
          <div>
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Lista de Espera: MindOps v1.0
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                Déjanos tu correo y serás el primero en saber cuándo nuestra versión comercial esté lista para el mercado.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2383e2] focus:border-transparent transition-colors ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={isLoading}
                  required
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-300 text-sm sm:text-base"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-colors duration-300 text-sm sm:text-base flex items-center justify-center ${
                    isLoading || !email
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#2383e2] text-white hover:bg-[#1d6ab8] transform hover:scale-105 shadow-lg'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registrando...
                    </>
                  ) : (
                    'Registrarme'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // Mensaje de confirmación
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                ¡Excelente! 🎉
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                Te hemos añadido a la lista. Te contactaremos para el lanzamiento de MindOps v1.0.
              </p>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">
                Correo registrado: <span className="font-medium text-gray-700">{email}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#2383e2] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1d6ab8] transition-colors duration-300 transform hover:scale-105 shadow-lg"
            >
              Cerrar
            </button>
          </div>
        )}
      </motion.div>
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
              Imagina una red de agentes de IA expertos—uno para cada área—que colaboran de forma segura bajo tu control. Te invitamos a probar la primera pieza de esta visión y ayudarnos a construirla.
            </p>            <div className="flex flex-row gap-3 sm:gap-4 mt-4">
                <a href="/login"
                className="flex-1 bg-[#2383e2] text-white font-bold py-2 px-4 sm:px-6 md:py-2.5 md:px-8 rounded-[13px] hover:bg-[#1d6ab8] transition-all duration-300 transform hover:scale-105 shadow-lg text-center text-sm sm:text-base flex items-center justify-center">
                Prueba el MVP y Ayúdanos
                </a>
              <a href="https://form.typeform.com/to/d2VE1GL0" target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-[#ebf5fe] text-[#2383e2] font-bold py-2 px-4 sm:px-6 md:py-2.5 md:px-8 rounded-[13px] border-2 border-[#2383e2] hover:bg-[#d6ebfd] transition-all duration-300 transform hover:scale-105 text-center text-sm sm:text-base flex items-center justify-center">
                Comparte tu Opinión
              </a>
            </div>
          </div>
          <div className="flex justify-center items-center">
            <img src={heroImage} alt="Mindgrate Hero Image" className="w-full max-w-md lg:max-w-2xl h-auto" />
          </div>
        </div>
      </section>
      {/* --- INICIO BLOQUE 1.5: --- */}
            <section className="w-full py-16 md:py-20 px-4 md:px-8 lg:px-24 text-center">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black leading-tight mb-4">
                    Los 3 Pilares de Nuestra Visión
                </h2>
                <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
                    Para resolver problemas complejos, construimos sobre tres principios inquebrantables: colaboración, flexibilidad y gobernanza humana.
                </p>
            </section>
            {/* --- FIN BLOQUE 1.5: --- */}

      {/* --- INICIO BLOQUE 2: EL CEREBRO EMPRESARIAL --- */}
      <section id="bloque-cerebro" className="w-full flex items-center py-16 md:py-20 px-4 md:px-8 lg:px-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-center lg:items-start gap-8">
            <FlipCard title="Colaboración nativa" subtitle="Agentes de IA especializados comparten contexto y resultados" backContent={<p className="text-lg p-2">Conecta agentes de IA especializados en un mismo entorno para compartir contexto y resultados sin intervención manual.</p>} className="w-full max-w-[597px] h-[198px]" />
            <FlipCard title="Arquitectura modular" subtitle="Ensamblas pequeñas inteligencias según tus necesidades" backContent={<p className="text-lg p-2">Despliega, actualiza o retira agentes según tus necesidades, ampliando capacidades sin tocar el núcleo del sistema.</p>} className="w-full max-w-[597px] h-[198px]" />
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
              Valida Nuestra Hipótesis con Nosotros:  <span className="text-[#2383e2]">Experimenta Nuestro MVP</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-700">
              Hemos construido este MVP para probar una idea clave: que un agente de IA puede entender tus datos de forma segura y útil. Tu feedback en esta fase inicial definirá nuestra versión comercial
            </p>
          </div>
          <div className="flex justify-center items-center">
            <FlipCard title="En esta fase inicial"
              subtitle={
                <ul className="text-left space-y-2 text-sm md:text-base">
                  <li><strong className="text-[#2383e2]">Carga tus Datos:</strong> Sube un archivo CSV, xls o xlsx con la información que consideres relevante.</li>
                  <li><strong className="text-[#2383e2]">Activa tu Agente:</strong> Tu agente personal asimilará esta información al instante.</li>
                  <li><strong className="text-[#2383e2]">Ponlo a Prueba:</strong> Realiza consultas, observa cómo tu agente te entrega respuestas y como interactua con otro agente.</li>
                </ul>
              }
              frontImage={ejmpeloimage} frontImageAlt="Ejemplo de Carga de CSV"
              backContent={
                <div className="p-2">
                  <h3 className="text-xl md:text-2xl font-bold mb-4">¿Por qué empezar con esta clase de archivos?</h3>
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
                    Nuestra Hoja de Ruta: Hacia la Transformación Operativa
                </h2>
                <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
                    Nuestro MVP valida la tecnología fundamental. Una vez probada, esta base nos permitirá desarrollar soluciones para los desafíos más costosos de la gestión de proyectos. Estos son los primeros horizontes en nuestra hoja de ruta, y tu perspectiva definirá cómo llegamos a ellos.
                </p>
            </section>
            {/* --- FIN BLOQUE 3.5: TRANSFORMACIÓN --- */}

      {/* --- INICIO BLOQUE 4: INTELIGENCIA EN ACCIÓN --- */}
      <section className="w-full flex items-center py-16 md:py-20 px-4 md:px-8 lg:px-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
            <FlipCard 
              title="Hoja de Ruta: Optimización Estratégica" 
              subtitle="Alinea recursos, presupuesto y tiempo de forma inteligente."
              backContent={<p className="text-lg p-2">Analiza la viabilidad de nuevos proyectos, consolida datos, estima presupuestos y asigna talento automáticamente.</p>} 
              className="w-full max-w-[600px] h-[350px] lg:h-[540px]" 
            />
            </div>
            <div className="flex flex-col gap-8">
                <FlipCard title="Hoja de Ruta: Detección Proactiva de Riesgos" subtitle="Anticípate a los problemas antes de que se conviertan en crisis" backContent={<p className="text-lg p-2">Anticípate a los problemas antes de que se conviertan en crisis, notificando a los agentes y personas clave.</p>} className="w-full h-[256px]" />
                <FlipCard title="Hoja de Ruta: Capitalización del Conocimiento" subtitle="Convierte la experiencia de tu equipo en un activo reutilizable" backContent={<p className="text-lg p-2">Captura aprendizajes al instante y hazlos accesibles para toda la red, mejorando la calidad y velocidad de tu servicio.</p>} className="w-full h-[256px]" />
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
              <a href="/login" className="flex-1 bg-[#2383e2] text-white font-bold py-2 px-4 sm:px-6 md:py-2.5 md:px-8 rounded-[13px] hover:bg-[#1d6ab8] transition-colors shadow-lg text-center text-sm sm:text-base flex items-center justify-center">Accede al MVP y Comparte tu Opinión</a>
              <button onClick={() => window.open('https://calendly.com/admin-mindgrate', '_blank')} className="flex-1 bg-[#ebf5fe] text-[#2383e2] font-bold py-2 px-4 sm:px-6 md:py-2.5 md:px-8 rounded-[13px] border-2 border-[#2383e2] hover:bg-[#d6ebfd] transition-colors text-center text-sm sm:text-base flex items-center justify-center">Habla con los Fundadores</button>
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
              ¿Te interesa la visión, pero no tienes tiempo para un MVP?
            </h2>
          </div>          <div className="flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">
            <p className="text-lg md:text-2xl text-gray-300">
              Entendemos que probar un producto en su etapa más temprana requiere tiempo. Si nuestra visión para transformar la gestión de proyectos te inspira, déjanos tu correo. Serás el primero en saber cuándo lancemos nuestra primera versión comercial, pulida y lista para el mercado.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#2383e2] text-white font-bold py-2.5 px-10 rounded-[13px] hover:bg-[#1d6ab8] transition-colors transform hover:scale-105 shadow-lg">
              Lista de Espera: MindOps v1.0
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
